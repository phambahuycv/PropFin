from fastapi import APIRouter, HTTPException
from typing import List, Optional
from database import get_db_connection
from models import ReminderCreate, ReminderUpdate, ReminderResponse
from datetime import datetime, date, timedelta

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])

@router.get("", response_model=List[ReminderResponse])
def get_reminders():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Đồng bộ các nhắc hẹn hệ thống thông minh tự động nếu chưa có
    today = date.today()
    current_month_str = today.strftime("%Y-%m")

    # 1. Quét các hợp đồng active để kiểm tra ngày đóng tiền phòng trong tháng
    cursor.execute("""
    SELECT c.*, r.room_code, r.floor
    FROM contracts c
    JOIN rooms r ON c.room_id = r.id
    WHERE c.status = 'active'
    """)
    active_contracts = cursor.fetchall()

    for c in active_contracts:
        billing_day = c["billing_day"] or 5
        try:
            due_d = date(today.year, today.month, min(billing_day, 28))
        except:
            due_d = date(today.year, today.month, 5)

        # Kiểm tra xem đã có hóa đơn tháng này chưa
        cursor.execute("SELECT id, payment_status FROM invoices WHERE contract_id = ? AND billing_month = ?", (c["id"], current_month_str))
        inv = cursor.fetchone()

        if not inv or inv["payment_status"] != "paid":
            # Kiểm tra xem đã tạo reminder chưa
            title = f"Thu tiền trọ tháng {today.month} - {c['room_code']} ({c['tenant_name']})"
            cursor.execute("SELECT id FROM reminders WHERE related_contract_id = ? AND reminder_type = 'rent_due' AND due_date LIKE ?", (c["id"], f"{current_month_str}%"))
            if not cursor.fetchone():
                cursor.execute("""
                INSERT INTO reminders (title, reminder_type, due_date, is_completed, related_room_id, related_contract_id, amount, notes)
                VALUES (?, 'rent_due', ?, 0, ?, ?, ?, ?)
                """, (title, due_d.strftime("%Y-%m-%d"), c["room_id"], c["id"], c["rent_price"], f"SĐT: {c['tenant_phone']} - Đóng tiền ngày {billing_day} hàng tháng"))

    # 2. Quét hợp đồng sắp hết hạn trong vòng 30 ngày
    in_30_days = today + timedelta(days=30)
    for c in active_contracts:
        try:
            exp_date = datetime.strptime(c["checkout_expected"], "%Y-%m-%d").date()
            if today <= exp_date <= in_30_days:
                title = f"Hợp đồng phòng {c['room_code']} ({c['tenant_name']}) sắp hết hạn ({c['checkout_expected']})"
                cursor.execute("SELECT id FROM reminders WHERE related_contract_id = ? AND reminder_type = 'contract_expiry'", (c["id"],))
                if not cursor.fetchone():
                    cursor.execute("""
                    INSERT INTO reminders (title, reminder_type, due_date, is_completed, related_room_id, related_contract_id, amount, notes)
                    VALUES (?, 'contract_expiry', ?, 0, ?, ?, 0, ?)
                    """, (title, c["checkout_expected"], c["room_id"], c["id"], f"Liên hệ khách SĐT {c['tenant_phone']} để gia hạn hoặc chuẩn bị tìm khách mới"))
        except:
            pass

    conn.commit()

    # Trả về danh sách reminders
    cursor.execute("""
    SELECT 
        rem.*,
        r.room_code,
        c.tenant_name
    FROM reminders rem
    LEFT JOIN rooms r ON rem.related_room_id = r.id
    LEFT JOIN contracts c ON rem.related_contract_id = c.id
    ORDER BY rem.is_completed ASC, rem.due_date ASC, rem.id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("", response_model=ReminderResponse)
def create_reminder(rem: ReminderCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO reminders (title, reminder_type, due_date, is_completed, related_room_id, related_contract_id, amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (rem.title, rem.reminder_type, rem.due_date, rem.is_completed, rem.related_room_id, rem.related_contract_id, rem.amount, rem.notes or ""))
    rem_id = cursor.lastrowid
    conn.commit()

    cursor.execute("""
    SELECT 
        rem.*,
        r.room_code,
        c.tenant_name
    FROM reminders rem
    LEFT JOIN rooms r ON rem.related_room_id = r.id
    LEFT JOIN contracts c ON rem.related_contract_id = c.id
    WHERE rem.id = ?
    """, (rem_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(reminder_id: int, rem: ReminderUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reminders WHERE id = ?", (reminder_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy nhắc hẹn")

    fields = []
    values = []
    for k, v in rem.model_dump(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)

    if fields:
        values.append(reminder_id)
        cursor.execute(f"UPDATE reminders SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    cursor.execute("""
    SELECT 
        rem.*,
        r.room_code,
        c.tenant_name
    FROM reminders rem
    LEFT JOIN rooms r ON rem.related_room_id = r.id
    LEFT JOIN contracts c ON rem.related_contract_id = c.id
    WHERE rem.id = ?
    """, (reminder_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Đã xóa nhắc hẹn"}
