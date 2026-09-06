from datetime import datetime, date, timedelta
from database import get_db_connection, init_db

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Seed Wallets (Ví ngân hàng & Tiền mặt)
    cursor.execute("SELECT COUNT(*) FROM wallets")
    if cursor.fetchone()[0] == 0:
        wallets = [
            ("Tài khoản Ngân hàng (MB Bank)", "bank", 25000000.0, "0987654321", "MB", "MBBank", "NGUYEN VAN A", 1),
            ("Ví Tiền mặt", "cash", 5000000.0, "", "", "", "NGUYEN VAN A", 0),
            ("Tài khoản Phụ (Vietcombank)", "bank", 12000000.0, "1012345678", "VCB", "Vietcombank", "NGUYEN VAN A", 0)
        ]
        cursor.executemany("""
        INSERT INTO wallets (name, type, balance, account_number, bank_code, bank_name, account_holder, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, wallets)

    # 2. Seed Categories (Danh mục Thu & Chi chi tiết đúng yêu cầu người dùng)
    cursor.execute("SELECT COUNT(*) FROM categories")
    if cursor.fetchone()[0] == 0:
        categories = [
            # Chi tiêu: Marketing (chi dụng cụ, chi nhân lực...)
            ("Marketing: Chi dụng cụ / Thiết bị", "expense", "Marketing", "camera", "#ec4899", 1),
            ("Marketing: Chi nhân lực / Thuê ngoài", "expense", "Marketing", "users", "#db2777", 1),
            ("Marketing: Quảng cáo & Công cụ", "expense", "Marketing", "megaphone", "#f43f5e", 1),
            
            # Chi tiêu: Tiêu dùng cá nhân
            ("Ăn uống & Sinh hoạt", "expense", "Tiêu dùng cá nhân", "utensils", "#f97316", 1),
            ("Mua sắm & Đồ dùng gia đình", "expense", "Tiêu dùng cá nhân", "shopping-bag", "#fb923c", 1),
            ("Xăng xe & Đi lại", "expense", "Tiêu dùng cá nhân", "car", "#ea580c", 1),
            ("Y tế & Sức khỏe", "expense", "Tiêu dùng cá nhân", "heart-pulse", "#e11d48", 1),
            
            # Chi tiêu: Đối nội, Đối ngoại
            ("Đối nội: Hiếu hỉ, Họ hàng", "expense", "Đối nội, Đối ngoại", "home", "#8b5cf6", 1),
            ("Đối ngoại: Ngoại giao, Quà biếu, Đối tác", "expense", "Đối nội, Đối ngoại", "gift", "#7c3aed", 1),
            
            # Chi tiêu: Học tập
            ("Học tập: Sách vở & Khóa học", "expense", "Học tập", "graduation-cap", "#3b82f6", 1),
            ("Học tập: Nâng cao kỹ năng / Chứng chỉ", "expense", "Học tập", "book-open", "#2563eb", 1),
            
            # Chi tiêu: Tiết kiệm & Đầu tư
            ("Tiết kiệm tích lũy", "expense", "Tiết kiệm & Đầu tư", "piggy-bank", "#10b981", 1),
            ("Đầu tư tài chính / Bất động sản", "expense", "Tiết kiệm & Đầu tư", "trending-up", "#059669", 1),
            
            # Chi tiêu: Vận hành nhà trọ
            ("Nhà trọ: Sửa chữa & Bảo trì", "expense", "Vận hành Nhà trọ", "wrench", "#64748b", 1),
            ("Nhà trọ: Mua sắm thiết bị phòng", "expense", "Vận hành Nhà trọ", "tv", "#475569", 1),
            ("Nhà trọ: Tiền điện nước tổng / Internet tổng", "expense", "Vận hành Nhà trọ", "zap", "#334155", 1),

            # Thu nhập
            ("Thu tiền Nhà trọ (Phòng thuê & Dịch vụ)", "income", "Nhà trọ", "building", "#10b981", 1),
            ("Tiền cọc Nhà trọ", "income", "Nhà trọ", "shield-check", "#059669", 1),
            ("Lương công ty", "income", "Thu nhập chính", "briefcase", "#3b82f6", 1),
            ("Lương của vợ/chồng", "income", "Thu nhập chính", "users", "#6366f1", 1),
            ("Thưởng & Hoa hồng", "income", "Thu nhập khác", "award", "#f59e0b", 1),
            ("Thu nhập ngoài / Kinh doanh thêm", "income", "Thu nhập khác", "dollar-sign", "#14b8a6", 1)
        ]
        cursor.executemany("""
        INSERT INTO categories (name, type, group_name, icon, color, is_system)
        VALUES (?, ?, ?, ?, ?, ?)
        """, categories)

    # 3. Seed Rooms (Các tầng 2, 3, 4, 5 - Mặt trong / Mặt ngoài)
    cursor.execute("SELECT COUNT(*) FROM rooms")
    if cursor.fetchone()[0] == 0:
        rooms = [
            # Tầng 2
            (2, "P.201", 2, "outside", 3800000.0, 3800000.0, "rented", 25.0, "Máy lạnh, Tủ lạnh, Giường nệm, Ban công thoáng", "Mặt ngoài đón sáng tốt"),
            (2, "P.202", 2, "inside", 3200000.0, 3200000.0, "rented", 20.0, "Máy lạnh, Giường nệm, Tủ quần áo, Quạt hút", "Mặt trong yên tĩnh"),
            (2, "P.203", 2, "outside", 3900000.0, 3900000.0, "empty", 26.0, "Full nội thất cao cấp, Ban công lớn", "Mặt ngoài view đẹp"),
            
            # Tầng 3
            (2, "P.301", 3, "outside", 3800000.0, 3800000.0, "rented", 25.0, "Máy lạnh, Tủ lạnh, Giường nệm, Ban công", "Mặt ngoài tầng 3"),
            (2, "P.302", 3, "inside", 3200000.0, 3200000.0, "rented", 20.0, "Máy lạnh, Giường nệm, Tủ quần áo", "Mặt trong"),
            (2, "P.303", 3, "inside", 3300000.0, 3300000.0, "empty", 22.0, "Máy lạnh, Bình nóng lạnh, Kệ bếp", "Mặt trong vừa trả phòng"),
            
            # Tầng 4
            (2, "P.401", 4, "outside", 3700000.0, 3700000.0, "rented", 25.0, "Full nội thất, Cửa sổ lớn, Ban công", "Mặt ngoài"),
            (2, "P.402", 4, "inside", 3100000.0, 3100000.0, "empty", 20.0, "Máy lạnh, Giường, Tủ", "Mặt trong"),
            (2, "P.403", 4, "outside", 3700000.0, 3700000.0, "rented", 24.0, "Máy lạnh, Nóng lạnh, Ban công", "Mặt ngoài"),

            # Tầng 5
            (2, "P.501", 5, "outside", 3600000.0, 3600000.0, "rented", 25.0, "Full nội thất, View tầng cao thoáng mát", "Mặt ngoài tầng thượng"),
            (2, "P.502", 5, "inside", 3000000.0, 3000000.0, "empty", 20.0, "Máy lạnh, Quạt hút, Giường nệm", "Mặt trong"),
            (2, "P.503", 5, "outside", 3600000.0, 3600000.0, "maintenance", 25.0, "Đang sơn sửa lại tường và thay vòi sen", "Mặt ngoài")
        ]
        cursor.executemany("""
        INSERT INTO rooms (property_id, room_code, floor, position, base_price, default_deposit, status, area_sqm, amenities, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, rooms)

    # 4. Seed Contracts (Hợp đồng mẫu)
    cursor.execute("SELECT COUNT(*) FROM contracts")
    if cursor.fetchone()[0] == 0:
        # Lấy id các phòng
        cursor.execute("SELECT id, room_code, base_price, default_deposit FROM rooms WHERE status = 'rented'")
        rented_rooms = cursor.fetchall()

        today = date.today()
        sample_tenants = [
            ("Nguyễn Văn Bình", "0912345678", "001200001234", 3500.0, 30000.0, 2, 100000.0, 30000.0, 100000.0, 5),
            ("Trần Thị Hoa", "0987111222", "001200005678", 3500.0, 30000.0, 1, 100000.0, 30000.0, 50000.0, 5),
            ("Lê Hoàng Nam", "0903333444", "001200009999", 3500.0, 30000.0, 2, 100000.0, 30000.0, 100000.0, 5),
            ("Phạm Minh Tuấn", "0934555666", "001200008888", 3500.0, 30000.0, 1, 100000.0, 30000.0, 50000.0, 5),
            ("Đỗ Mai Anh", "0978999000", "001200007777", 3500.0, 30000.0, 2, 100000.0, 30000.0, 100000.0, 5),
            ("Vũ Quốc Cường", "0945666777", "001200006666", 3500.0, 30000.0, 1, 100000.0, 30000.0, 50000.0, 5),
            ("Hoàng Thu Trang", "0967222333", "001200005555", 3500.0, 30000.0, 2, 100000.0, 30000.0, 100000.0, 5),
        ]

        for i, room in enumerate(rented_rooms):
            if i < len(sample_tenants):
                t = sample_tenants[i]
                checkin = (today - timedelta(days=90 + i*15)).strftime("%Y-%m-%d")
                checkout = (today + timedelta(days=180 - i*20)).strftime("%Y-%m-%d")
                cursor.execute("""
                INSERT INTO contracts (
                    room_id, tenant_name, tenant_phone, tenant_id_card, checkin_date, checkout_expected,
                    rent_price, deposit_amount, electricity_rate, water_rate, water_billing_type, water_person_count,
                    internet_fee, garbage_fee, parking_fee, other_fee, billing_day, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'per_person', ?, ?, ?, ?, 0, ?, 'active', ?)
                """, (
                    room["id"], t[0], t[1], t[2], checkin, checkout,
                    room["base_price"], room["default_deposit"], t[3], t[4], t[5],
                    t[6], t[7], t[8], t[9], "Hợp đồng ký 1 năm, đóng tiền mùng 5"
                ))

    # 5. Seed Transactions (Giao dịch thu chi mẫu)
    cursor.execute("SELECT COUNT(*) FROM transactions")
    if cursor.fetchone()[0] == 0:
        # Lấy category IDs
        cursor.execute("SELECT id, name FROM categories")
        cat_map = {row["name"]: row["id"] for row in cursor.fetchall()}
        
        cursor.execute("SELECT id, name FROM wallets")
        wallet_rows = cursor.fetchall()
        bank_id = wallet_rows[0]["id"] if wallet_rows else 1
        cash_id = wallet_rows[1]["id"] if len(wallet_rows) > 1 else 1

        sample_transactions = [
            # Thu nhập
            ("Lương công ty tháng này", 22000000.0, "income", cat_map.get("Lương công ty"), bank_id, "2026-08-05 09:00", "Lương chuyển khoản Techcombank"),
            ("Lương của vợ tháng này", 18000000.0, "income", cat_map.get("Lương của vợ/chồng"), bank_id, "2026-08-10 10:30", "Lương công ty vợ"),
            ("Thu tiền trọ P.201 tháng 8", 4350000.0, "income", cat_map.get("Thu tiền Nhà trọ (Phòng thuê & Dịch vụ)"), bank_id, "2026-08-05 14:20", "Phòng 201 đóng tiền phòng + điện nước"),
            ("Thu tiền trọ P.301 tháng 8", 4420000.0, "income", cat_map.get("Thu tiền Nhà trọ (Phòng thuê & Dịch vụ)"), bank_id, "2026-08-05 15:00", "Phòng 301 chuyển khoản"),
            ("Thu tiền cọc phòng P.403", 3700000.0, "income", cat_map.get("Tiền cọc Nhà trọ"), bank_id, "2026-08-01 11:00", "Cọc giữ phòng mới"),

            # Chi tiêu: Marketing
            ("Chi mua micro + đèn livestream", 1850000.0, "expense", cat_map.get("Marketing: Chi dụng cụ / Thiết bị"), bank_id, "2026-08-12 16:00", "Dụng cụ quay clip marketing phòng trọ"),
            ("Chi thuê nhân sự chạy quảng cáo Facebook/Tiktok", 2500000.0, "expense", cat_map.get("Marketing: Chi nhân lực / Thuê ngoài"), bank_id, "2026-08-15 11:30", "Thuê nhân lực làm media và content"),
            ("Nạp tiền quảng cáo Facebook", 1200000.0, "expense", cat_map.get("Marketing: Quảng cáo & Công cụ"), bank_id, "2026-08-18 10:00", "Quảng cáo tin cho thuê phòng"),

            # Chi tiêu: Tiêu dùng cá nhân
            ("Đi chợ & Siêu thị tuần 1", 1450000.0, "expense", cat_map.get("Ăn uống & Sinh hoạt"), cash_id, "2026-08-07 18:00", "Thực phẩm cả tuần"),
            ("Đổ xăng xe máy & ô tô", 850000.0, "expense", cat_map.get("Xăng xe & Đi lại"), bank_id, "2026-08-09 08:30", "Xăng xe cả nhà"),
            ("Mua sắm đồ dùng gia đình", 1200000.0, "expense", cat_map.get("Mua sắm & Đồ dùng gia đình"), bank_id, "2026-08-14 20:00", "Nồi chiên không dầu & vật dụng"),

            # Chi tiêu: Đối nội, Đối ngoại
            ("Biếu ông bà nội ngoại đầu tháng", 3000000.0, "expense", cat_map.get("Đối nội: Hiếu hỉ, Họ hàng"), bank_id, "2026-08-06 09:00", "Tiền biếu bố mẹ 2 bên"),
            ("Mời cơm đối tác & giao lưu quan hệ", 1150000.0, "expense", cat_map.get("Đối ngoại: Ngoại giao, Quà biếu, Đối tác"), bank_id, "2026-08-20 19:30", "Ăn tối tiếp khách"),

            # Chi tiêu: Học tập
            ("Mua sách kinh doanh & đầu tư", 450000.0, "expense", cat_map.get("Học tập: Sách vở & Khóa học"), bank_id, "2026-08-11 14:00", "Sách Tiki"),
            ("Khóa học nâng cao kỹ năng Python & Quản lý", 1500000.0, "expense", cat_map.get("Học tập: Nâng cao kỹ năng / Chứng chỉ"), bank_id, "2026-08-22 21:00", "Đăng ký khóa học trực tuyến"),

            # Chi tiêu: Tiết kiệm & Đầu tư
            ("Gửi tiết kiệm tích lũy ngân hàng", 10000000.0, "expense", cat_map.get("Tiết kiệm tích lũy"), bank_id, "2026-08-25 10:00", "Gửi sổ tiết kiệm online"),

            # Chi tiêu: Vận hành nhà trọ
            ("Thay aptomat & sửa vòi nước tầng 5", 450000.0, "expense", cat_map.get("Nhà trọ: Sửa chữa & Bảo trì"), cash_id, "2026-08-16 15:30", "Thợ điện nước sửa P.503"),
            ("Thanh toán tiền mạng cáp quang tòa nhà", 380000.0, "expense", cat_map.get("Nhà trọ: Tiền điện nước tổng / Internet tổng"), bank_id, "2026-08-17 09:15", "Internet VNPT gói 300Mbps")
        ]

        cursor.executemany("""
        INSERT INTO transactions (title, amount, type, category_id, wallet_id, transaction_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, sample_transactions)

    # 6. Seed Reminders
    cursor.execute("SELECT COUNT(*) FROM reminders")
    if cursor.fetchone()[0] == 0:
        reminders = [
            ("Thu tiền trọ tháng 9 phòng P.201, P.202, P.301, P.401, P.501", "rent_due", "2026-09-05", 0, None, None, 0.0, "Đến kỳ chốt điện nước và gửi thông báo bill cho khách"),
            ("Nhắc hợp đồng P.403 sắp hết hạn trong 30 ngày", "contract_expiry", "2026-09-20", 0, None, None, 0.0, "Hỏi khách gia hạn hoặc đăng tin tìm người thuê mới"),
            ("Khách phòng P.503 dự kiến hoàn thành sửa chữa", "custom", "2026-09-08", 0, None, None, 0.0, "Nghiệm thu thợ sơn và lắp lại thiết bị"),
            ("Ngày đóng tiền lãi vay / tiết kiệm định kỳ", "custom", "2026-09-10", 0, None, None, 5000000.0, "Trích từ tài khoản MB sang sổ tiết kiệm")
        ]
        cursor.executemany("""
        INSERT INTO reminders (title, reminder_type, due_date, is_completed, related_room_id, related_contract_id, amount, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, reminders)

    conn.commit()
    conn.close()
    print("Seed data populated successfully!")

if __name__ == "__main__":
    seed_database()
