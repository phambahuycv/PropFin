import sqlite3
import os
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent.parent / "propfin.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Wallets / Accounts table (Ngân hàng & Tiền mặt)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('bank', 'cash', 'e_wallet')),
        balance REAL DEFAULT 0.0,
        account_number TEXT DEFAULT '',
        bank_code TEXT DEFAULT '',
        bank_name TEXT DEFAULT '',
        account_holder TEXT DEFAULT '',
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Categories table (Danh mục Thu & Chi)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        group_name TEXT NOT NULL,
        icon TEXT DEFAULT 'tag',
        color TEXT DEFAULT '#4f46e5',
        is_system INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Properties table (Căn hộ / Tòa nhà / Dãy nhà)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT DEFAULT '',
        address TEXT DEFAULT '',
        total_floors INTEGER DEFAULT 1,
        property_type TEXT DEFAULT 'apartment' CHECK(property_type IN ('apartment', 'mini_building', 'boarding_house', 'house')),
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Rooms table (Phòng riêng)
    # Tầng: 2, 3, 4, 5... | Vị trí: inside (Mặt trong) / outside (Mặt ngoài)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER DEFAULT 1,
        room_code TEXT NOT NULL,
        floor INTEGER NOT NULL,
        position TEXT NOT NULL CHECK(position IN ('inside', 'outside')),
        base_price REAL DEFAULT 0.0,
        default_deposit REAL DEFAULT 0.0,
        status TEXT NOT NULL DEFAULT 'empty' CHECK(status IN ('empty', 'rented', 'maintenance')),
        area_sqm REAL DEFAULT 0.0,
        amenities TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );
    """)

    # Tự động Migration kiểm tra cột property_id trong bảng rooms (nếu DB đã có sẵn)
    cursor.execute("PRAGMA table_info(rooms)")
    room_cols = [c[1] for c in cursor.fetchall()]
    if "property_id" not in room_cols:
        cursor.execute("ALTER TABLE rooms ADD COLUMN property_id INTEGER DEFAULT 1")

    # Đảm bảo có ít nhất căn hộ / tòa nhà mặc định nếu bảng properties đang trống
    cursor.execute("SELECT COUNT(*) FROM properties")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO properties (id, name, code, address, total_floors, property_type, notes)
        VALUES 
        (1, 'Căn hộ Vinhomes - CL6-131', 'CL6-131', 'Phân khu The Origami, Vinhomes Grand Park, TP. Thủ Đức', 1, 'apartment', 'Căn hộ chung cư 2PN+1 cho thuê'),
        (2, 'Tòa Nhà Cho Thuê Sunrise', 'SNR', 'Số 15 Ngõ 68 Cầu Giấy, Hà Nội', 5, 'mini_building', 'Tòa nhà căn hộ mini 5 tầng cho thuê')
        """)
        # Cập nhật phân bổ phòng hiện tại vào căn hộ tương ứng
        cursor.execute("UPDATE rooms SET property_id = 1 WHERE room_code LIKE '%CL6%'")
        cursor.execute("UPDATE rooms SET property_id = 2 WHERE room_code NOT LIKE '%CL6%'")

    # 4. Contracts table (Hợp đồng thuê & Khách)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        tenant_name TEXT NOT NULL,
        tenant_phone TEXT NOT NULL,
        tenant_id_card TEXT DEFAULT '',
        checkin_date TEXT NOT NULL,
        checkout_expected TEXT NOT NULL,
        checkout_actual TEXT DEFAULT NULL,
        rent_price REAL NOT NULL,
        deposit_amount REAL DEFAULT 0.0,
        deposit_status TEXT DEFAULT 'held' CHECK(deposit_status IN ('held', 'refunded', 'deducted')),
        
        -- Phí dịch vụ chi tiết từng căn
        electricity_rate REAL DEFAULT 3500.0,
        water_rate REAL DEFAULT 30000.0,
        water_billing_type TEXT DEFAULT 'per_person' CHECK(water_billing_type IN ('meter', 'per_person', 'fixed')),
        water_person_count INTEGER DEFAULT 1,
        internet_fee REAL DEFAULT 100000.0,
        garbage_fee REAL DEFAULT 30000.0,
        parking_fee REAL DEFAULT 0.0,
        other_fee REAL DEFAULT 0.0,
        other_fee_note TEXT DEFAULT '',
        
        billing_day INTEGER DEFAULT 5, -- Ngày đóng tiền hàng tháng
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'ending_soon', 'ended')),
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
    """)

    # 5. Monthly Invoices (Hóa đơn & Chốt điện nước)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        billing_month TEXT NOT NULL, -- YYYY-MM
        billing_date TEXT NOT NULL,  -- Ngày lập hóa đơn
        
        -- Chỉ số điện
        prev_electricity REAL DEFAULT 0.0,
        curr_electricity REAL DEFAULT 0.0,
        electricity_usage REAL DEFAULT 0.0,
        electricity_rate REAL DEFAULT 3500.0,
        electricity_amount REAL DEFAULT 0.0,
        
        -- Chỉ số nước
        water_billing_type TEXT DEFAULT 'per_person',
        prev_water REAL DEFAULT 0.0,
        curr_water REAL DEFAULT 0.0,
        water_usage REAL DEFAULT 0.0,
        water_rate REAL DEFAULT 30000.0,
        water_amount REAL DEFAULT 0.0,
        
        -- Tiền phòng & các phí
        room_amount REAL NOT NULL,
        internet_amount REAL DEFAULT 0.0,
        garbage_amount REAL DEFAULT 0.0,
        parking_amount REAL DEFAULT 0.0,
        other_amount REAL DEFAULT 0.0,
        other_note TEXT DEFAULT '',
        discount_amount REAL DEFAULT 0.0,
        
        total_amount REAL NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'partial')),
        paid_amount REAL DEFAULT 0.0,
        paid_date TEXT DEFAULT NULL,
        wallet_id INTEGER DEFAULT NULL,
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
        FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY(wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
    );
    """)

    # 6. Transactions (Thu - Chi cá nhân, gia đình, nhà trọ)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
        category_id INTEGER,
        wallet_id INTEGER NOT NULL,
        destination_wallet_id INTEGER DEFAULT NULL, -- Dùng cho chuyển khoản giữa 2 ví
        transaction_date TEXT NOT NULL, -- YYYY-MM-DD or YYYY-MM-DD HH:MM
        notes TEXT DEFAULT '',
        ref_invoice_id INTEGER DEFAULT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY(wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
        FOREIGN KEY(destination_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
        FOREIGN KEY(ref_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    );
    """)

    # 7. Reminders (Trung tâm nhắc hẹn & cảnh báo)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        reminder_type TEXT NOT NULL CHECK(reminder_type IN ('rent_due', 'contract_expiry', 'checkout', 'bill_meter', 'custom')),
        due_date TEXT NOT NULL, -- YYYY-MM-DD
        is_completed INTEGER DEFAULT 0,
        related_room_id INTEGER DEFAULT NULL,
        related_contract_id INTEGER DEFAULT NULL,
        amount REAL DEFAULT 0.0,
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(related_room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY(related_contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
