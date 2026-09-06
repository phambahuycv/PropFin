from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database import get_db_connection
from models import InvoiceCreate, InvoicePaymentUpdate, InvoiceResponse
from datetime import datetime, date

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

@router.get("/suggest/{room_id}")
def suggest_invoice_data(room_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Tìm hợp đồng đang active
    cursor.execute("""
    SELECT c.*, r.room_code, r.floor, r.position
    FROM contracts c
    JOIN rooms r ON c.room_id = r.id
    WHERE c.room_id = ? AND c.status = 'active'
    ORDER BY c.id DESC LIMIT 1
    """, (room_id,))
    contract = cursor.fetchone()
    if not contract:
        conn.close()
        raise HTTPException(status_code=400, detail="Phòng này hiện chưa có hợp đồng thuê hoạt động!")

    # 2. Tìm chỉ số điện nước hóa đơn gần nhất
    cursor.execute("""
    SELECT curr_electricity, curr_water, billing_month
    FROM invoices
    WHERE room_id = ?
    ORDER BY billing_month DESC, id DESC LIMIT 1
    """, (room_id,))
    last_inv = cursor.fetchone()

    prev_elec = last_inv["curr_electricity"] if last_inv else 0.0
    prev_water = last_inv["curr_water"] if last_inv else 0.0

    today = date.today()
    current_month = today.strftime("%Y-%m")

    result = {
        "room_id": room_id,
        "room_code": contract["room_code"],
        "floor": contract["floor"],
        "position": contract["position"],
        "contract_id": contract["id"],
        "tenant_name": contract["tenant_name"],
        "tenant_phone": contract["tenant_phone"],
        "billing_month": current_month,
        "billing_date": today.strftime("%Y-%m-%d"),
        "prev_electricity": prev_elec,
        "curr_electricity": prev_elec, # Mặc định để người dùng nhập tiếp
        "electricity_rate": contract["electricity_rate"],
        "water_billing_type": contract["water_billing_type"],
        "prev_water": prev_water,
        "curr_water": prev_water,
        "water_rate": contract["water_rate"],
        "water_person_count": contract["water_person_count"],
        "room_amount": contract["rent_price"],
        "internet_amount": contract["internet_fee"],
        "garbage_amount": contract["garbage_fee"],
        "parking_amount": contract["parking_fee"],
        "other_amount": contract["other_fee"],
        "other_note": contract["other_fee_note"] or ""
    }
    conn.close()
    return result

@router.get("", response_model=List[InvoiceResponse])
def get_invoices(
    month: Optional[str] = None,
    room_id: Optional[int] = None,
    payment_status: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    SELECT 
        inv.*,
        r.room_code,
        r.floor,
        c.tenant_name,
        c.tenant_phone,
        w.name as wallet_name
    FROM invoices inv
    JOIN rooms r ON inv.room_id = r.id
    JOIN contracts c ON inv.contract_id = c.id
    LEFT JOIN wallets w ON inv.wallet_id = w.id
    WHERE 1=1
    """
    params = []
    if month:
        query += " AND inv.billing_month = ?"
        params.append(month)
    if room_id:
        query += " AND inv.room_id = ?"
        params.append(room_id)
    if payment_status:
        query += " AND inv.payment_status = ?"
        params.append(payment_status)

    query += " ORDER BY inv.billing_month DESC, r.floor ASC, r.room_code ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        inv.*,
        r.room_code,
        r.floor,
        c.tenant_name,
        c.tenant_phone,
        w.name as wallet_name
    FROM invoices inv
    JOIN rooms r ON inv.room_id = r.id
    JOIN contracts c ON inv.contract_id = c.id
    LEFT JOIN wallets w ON inv.wallet_id = w.id
    WHERE inv.id = ?
    """, (invoice_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy hóa đơn")
    return dict(row)

@router.post("", response_model=InvoiceResponse)
def create_invoice(inv: InvoiceCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Tính toán điện
        elec_usage = max(0.0, inv.curr_electricity - inv.prev_electricity)
        elec_amount = elec_usage * inv.electricity_rate

        # Tính toán nước
        if inv.water_billing_type == "meter":
            water_usage = max(0.0, inv.curr_water - inv.prev_water)
            water_amount = water_usage * inv.water_rate
        elif inv.water_billing_type == "per_person":
            water_usage = inv.curr_water # có thể lưu số người
            water_amount = inv.water_amount if inv.water_amount > 0 else inv.water_rate
        else:
            water_usage = 0.0
            water_amount = inv.water_amount

        total = (
            inv.room_amount +
            elec_amount +
            water_amount +
            inv.internet_amount +
            inv.garbage_amount +
            inv.parking_amount +
            inv.other_amount -
            inv.discount_amount
        )

        cursor.execute("""
        INSERT INTO invoices (
            contract_id, room_id, billing_month, billing_date,
            prev_electricity, curr_electricity, electricity_usage, electricity_rate, electricity_amount,
            water_billing_type, prev_water, curr_water, water_usage, water_rate, water_amount,
            room_amount, internet_amount, garbage_amount, parking_amount, other_amount, other_note,
            discount_amount, total_amount, payment_status, paid_amount, paid_date, wallet_id, notes
        ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
        )
        """, (
            inv.contract_id, inv.room_id, inv.billing_month, inv.billing_date,
            inv.prev_electricity, inv.curr_electricity, elec_usage, inv.electricity_rate, elec_amount,
            inv.water_billing_type, inv.prev_water, inv.curr_water, water_usage, inv.water_rate, water_amount,
            inv.room_amount, inv.internet_amount, inv.garbage_amount, inv.parking_amount, inv.other_amount, inv.other_note or "",
            inv.discount_amount, total, inv.payment_status, inv.paid_amount, inv.paid_date, inv.wallet_id, inv.notes or ""
        ))
        inv_id = cursor.lastrowid
        conn.commit()

        cursor.execute("""
        SELECT 
            inv.*,
            r.room_code,
            r.floor,
            c.tenant_name,
            c.tenant_phone,
            w.name as wallet_name
        FROM invoices inv
        JOIN rooms r ON inv.room_id = r.id
        JOIN contracts c ON inv.contract_id = c.id
        LEFT JOIN wallets w ON inv.wallet_id = w.id
        WHERE inv.id = ?
        """, (inv_id,))
        row = cursor.fetchone()
        return dict(row)
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

@router.post("/{invoice_id}/pay")
def pay_invoice(invoice_id: int, pay_data: InvoicePaymentUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
        SELECT inv.*, r.room_code, c.tenant_name
        FROM invoices inv
        JOIN rooms r ON inv.room_id = r.id
        JOIN contracts c ON inv.contract_id = c.id
        WHERE inv.id = ?
        """, (invoice_id,))
        inv = cursor.fetchone()
        if not inv:
            raise HTTPException(status_code=404, detail="Không tìm thấy hóa đơn")

        # Cập nhật trạng thái thanh toán hóa đơn
        cursor.execute("""
        UPDATE invoices
        SET payment_status = ?, paid_amount = ?, paid_date = ?, wallet_id = ?
        WHERE id = ?
        """, (pay_data.payment_status, pay_data.paid_amount, pay_data.paid_date, pay_data.wallet_id, invoice_id))

        if pay_data.auto_create_income and pay_data.payment_status == "paid":
            # Tìm category "Thu tiền Nhà trọ (Phòng thuê & Dịch vụ)"
            cursor.execute("SELECT id FROM categories WHERE name LIKE '%Thu tiền Nhà trọ%' LIMIT 1")
            cat_row = cursor.fetchone()
            cat_id = cat_row["id"] if cat_row else None

            # Tạo giao dịch Thu
            title = f"Thu tiền trọ {inv['room_code']} tháng {inv['billing_month']} ({inv['tenant_name']})"
            cursor.execute("""
            INSERT INTO transactions (title, amount, type, category_id, wallet_id, transaction_date, notes, ref_invoice_id)
            VALUES (?, ?, 'income', ?, ?, ?, ?, ?)
            """, (title, pay_data.paid_amount, cat_id, pay_data.wallet_id, f"{pay_data.paid_date} 12:00", f"Tự động tạo từ hóa đơn #{invoice_id}", invoice_id))

            # Cộng tiền vào ví
            cursor.execute("UPDATE wallets SET balance = balance + ? WHERE id = ?", (pay_data.paid_amount, pay_data.wallet_id))

        conn.commit()
        return {"success": True, "message": "Đã thanh toán hóa đơn và đồng bộ vào Quỹ thu chi thành công"}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Kiểm tra xem có giao dịch thu nhập nào liên kết không
    cursor.execute("SELECT id, amount, wallet_id FROM transactions WHERE ref_invoice_id = ?", (invoice_id,))
    tx_rows = cursor.fetchall()
    for tx in tx_rows:
        cursor.execute("UPDATE wallets SET balance = balance - ? WHERE id = ?", (tx["amount"], tx["wallet_id"]))
        cursor.execute("DELETE FROM transactions WHERE id = ?", (tx["id"],))

    cursor.execute("DELETE FROM invoices WHERE id = ?", (invoice_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Đã xóa hóa đơn"}
