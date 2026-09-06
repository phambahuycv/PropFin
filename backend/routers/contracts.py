from fastapi import APIRouter, HTTPException
from typing import List, Optional
from database import get_db_connection
from models import ContractCreate, ContractUpdate, ContractResponse
from datetime import datetime, date

router = APIRouter(prefix="/api/contracts", tags=["Contracts"])

@router.get("", response_model=List[ContractResponse])
def get_contracts(
    status: Optional[str] = None,
    room_id: Optional[int] = None,
    property_id: Optional[int] = None,
    search: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    SELECT 
        c.*,
        r.property_id,
        p.name as property_name,
        r.room_code,
        r.floor,
        r.position
    FROM contracts c
    JOIN rooms r ON c.room_id = r.id
    LEFT JOIN properties p ON r.property_id = p.id
    WHERE 1=1
    """
    params = []
    if status:
        if status == 'ending_soon':
            # Active contracts ending within 30 days
            today_str = date.today().strftime("%Y-%m-%d")
            query += " AND c.status = 'active' AND c.checkout_expected <= date(?, '+30 days') AND c.checkout_expected >= ?"
            params.extend([today_str, today_str])
        else:
            query += " AND c.status = ?"
            params.append(status)
    if room_id:
        query += " AND c.room_id = ?"
        params.append(room_id)
    if property_id:
        query += " AND r.property_id = ?"
        params.append(property_id)
    if search:
        query += " AND (c.tenant_name LIKE ? OR c.tenant_phone LIKE ? OR c.tenant_id_card LIKE ? OR r.room_code LIKE ?)"
        kw = f"%{search}%"
        params.extend([kw, kw, kw, kw])

    query += " ORDER BY c.status ASC, c.checkin_date DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        c.*,
        r.property_id,
        p.name as property_name,
        r.room_code,
        r.floor,
        r.position
    FROM contracts c
    JOIN rooms r ON c.room_id = r.id
    LEFT JOIN properties p ON r.property_id = p.id
    WHERE c.id = ?
    """, (contract_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")
    return dict(row)

@router.post("", response_model=ContractResponse)
def create_contract(contract: ContractCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Kiểm tra xem phòng có đang có hợp đồng active không
        cursor.execute("SELECT id FROM contracts WHERE room_id = ? AND status = 'active'", (contract.room_id,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Phòng này đang có khách thuê hoạt động. Hãy kết thúc hợp đồng cũ trước.")

        cursor.execute("""
        INSERT INTO contracts (
            room_id, tenant_name, tenant_phone, tenant_id_card, checkin_date, checkout_expected,
            rent_price, deposit_amount, deposit_status, electricity_rate, water_rate,
            water_billing_type, water_person_count, internet_fee, garbage_fee, parking_fee,
            other_fee, other_fee_note, billing_day, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            contract.room_id, contract.tenant_name, contract.tenant_phone, contract.tenant_id_card or "",
            contract.checkin_date, contract.checkout_expected, contract.rent_price, contract.deposit_amount,
            contract.deposit_status or "held", contract.electricity_rate, contract.water_rate,
            contract.water_billing_type, contract.water_person_count, contract.internet_fee,
            contract.garbage_fee, contract.parking_fee, contract.other_fee, contract.other_fee_note or "",
            contract.billing_day, contract.status, contract.notes or ""
        ))
        contract_id = cursor.lastrowid

        # Cập nhật trạng thái phòng thành 'rented'
        cursor.execute("UPDATE rooms SET status = 'rented' WHERE id = ?", (contract.room_id,))

        # Tự động tạo lời nhắc hết hạn hợp đồng
        cursor.execute("""
        INSERT INTO reminders (title, reminder_type, due_date, related_room_id, related_contract_id, notes)
        VALUES (?, 'contract_expiry', ?, ?, ?, ?)
        """, (
            f"Hết hạn hợp đồng phòng (Khách: {contract.tenant_name})",
            contract.checkout_expected,
            contract.room_id,
            contract_id,
            f"SĐT khách: {contract.tenant_phone}"
        ))

        conn.commit()

        cursor.execute("""
        SELECT 
            c.*,
            r.property_id,
            p.name as property_name,
            r.room_code,
            r.floor,
            r.position
        FROM contracts c
        JOIN rooms r ON c.room_id = r.id
        LEFT JOIN properties p ON r.property_id = p.id
        WHERE c.id = ?
        """, (contract_id,))
        row = cursor.fetchone()
        return dict(row)
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(contract_id: int, contract: ContractUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM contracts WHERE id = ?", (contract_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    fields = []
    values = []
    for k, v in contract.model_dump(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)

    if fields:
        values.append(contract_id)
        cursor.execute(f"UPDATE contracts SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    cursor.execute("""
    SELECT 
        c.*,
        r.property_id,
        p.name as property_name,
        r.room_code,
        r.floor,
        r.position
    FROM contracts c
    JOIN rooms r ON c.room_id = r.id
    LEFT JOIN properties p ON r.property_id = p.id
    WHERE c.id = ?
    """, (contract_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

@router.post("/{contract_id}/terminate")
def terminate_contract(contract_id: int, checkout_date: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM contracts WHERE id = ?", (contract_id,))
    c = cursor.fetchone()
    if not c:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    actual_checkout = checkout_date or date.today().strftime("%Y-%m-%d")
    cursor.execute("UPDATE contracts SET status = 'ended', checkout_actual = ? WHERE id = ?", (actual_checkout, contract_id))
    cursor.execute("UPDATE rooms SET status = 'empty' WHERE id = ?", (c["room_id"],))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Đã kết thúc hợp đồng và cập nhật phòng về trạng thái Trống"}

@router.delete("/{contract_id}")
def delete_contract(contract_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT room_id FROM contracts WHERE id = ?", (contract_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy hợp đồng")

    room_id = row["room_id"]
    cursor.execute("DELETE FROM contracts WHERE id = ?", (contract_id,))
    cursor.execute("UPDATE rooms SET status = 'empty' WHERE id = ?", (room_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Đã xóa hợp đồng"}
