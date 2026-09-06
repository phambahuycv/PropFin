from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database import get_db_connection
from models import RoomCreate, RoomUpdate, RoomResponse

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])

@router.get("", response_model=List[RoomResponse])
def get_rooms(
    property_id: Optional[int] = None,
    floor: Optional[int] = None,
    position: Optional[str] = None,
    status: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    SELECT 
        r.*,
        p.name as property_name,
        c.id as contract_id,
        c.tenant_name,
        c.tenant_phone
    FROM rooms r
    LEFT JOIN properties p ON r.property_id = p.id
    LEFT JOIN contracts c ON r.id = c.room_id AND c.status = 'active'
    WHERE 1=1
    """
    params = []
    if property_id is not None:
        query += " AND r.property_id = ?"
        params.append(property_id)
    if floor is not None:
        query += " AND r.floor = ?"
        params.append(floor)
    if position:
        query += " AND r.position = ?"
        params.append(position)
    if status:
        query += " AND r.status = ?"
        params.append(status)

    query += " ORDER BY r.property_id ASC, r.floor ASC, r.room_code ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("", response_model=RoomResponse)
def create_room(room: RoomCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Kiểm tra mã phòng theo property_id
    cursor.execute("SELECT id FROM rooms WHERE room_code = ? AND property_id = ?", (room.room_code, room.property_id or 1))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Mã số phòng đã tồn tại trong căn hộ / tòa nhà này!")

    cursor.execute("""
    INSERT INTO rooms (property_id, room_code, floor, position, base_price, default_deposit, status, area_sqm, amenities, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (room.property_id or 1, room.room_code, room.floor, room.position, room.base_price, room.default_deposit, room.status, room.area_sqm or 0.0, room.amenities or "", room.notes or ""))
    room_id = cursor.lastrowid
    conn.commit()

    cursor.execute("""
    SELECT 
        r.*,
        p.name as property_name,
        c.id as contract_id,
        c.tenant_name,
        c.tenant_phone
    FROM rooms r
    LEFT JOIN properties p ON r.property_id = p.id
    LEFT JOIN contracts c ON r.id = c.room_id AND c.status = 'active'
    WHERE r.id = ?
    """, (room_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

@router.put("/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, room: RoomUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms WHERE id = ?", (room_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng")

    fields = []
    values = []
    for k, v in room.model_dump(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)

    if fields:
        values.append(room_id)
        cursor.execute(f"UPDATE rooms SET {', '.join(fields)} WHERE id = ?", values)
        
        # Nếu phòng đổi trạng thái về empty, có thể cập nhật hợp đồng cũ
        if room.status == 'empty':
            cursor.execute("UPDATE contracts SET status = 'ended' WHERE room_id = ? AND status = 'active'", (room_id,))

        conn.commit()

    cursor.execute("""
    SELECT 
        r.*,
        p.name as property_name,
        c.id as contract_id,
        c.tenant_name,
        c.tenant_phone
    FROM rooms r
    LEFT JOIN properties p ON r.property_id = p.id
    LEFT JOIN contracts c ON r.id = c.room_id AND c.status = 'active'
    WHERE r.id = ?
    """, (room_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

@router.delete("/{room_id}")
def delete_room(room_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, room_code FROM rooms WHERE id = ?", (room_id,))
    room = cursor.fetchone()
    if not room:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng")

    try:
        # Xóa các dữ liệu liên quan đến phòng
        cursor.execute("DELETE FROM reminders WHERE related_room_id = ?", (room_id,))
        
        # Xóa transactions liên kết qua invoices của phòng
        cursor.execute("SELECT id FROM invoices WHERE room_id = ?", (room_id,))
        inv_ids = [row["id"] for row in cursor.fetchall()]
        if inv_ids:
            placeholders = ",".join("?" for _ in inv_ids)
            cursor.execute(f"DELETE FROM transactions WHERE ref_invoice_id IN ({placeholders})", inv_ids)
            cursor.execute(f"DELETE FROM invoices WHERE id IN ({placeholders})", inv_ids)

        cursor.execute("DELETE FROM contracts WHERE room_id = ?", (room_id,))
        cursor.execute("DELETE FROM rooms WHERE id = ?", (room_id,))
        conn.commit()
        return {"success": True, "message": f"Đã xóa phòng {room['room_code']} và toàn bộ dữ liệu liên quan thành công"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa phòng: {str(e)}")
    finally:
        conn.close()
