from fastapi import APIRouter, HTTPException
from typing import List, Optional
from database import get_db_connection
from models import PropertyCreate, PropertyUpdate, PropertyResponse

router = APIRouter(prefix="/api/properties", tags=["Properties"])

@router.get("", response_model=List[PropertyResponse])
def get_properties():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    SELECT 
        p.*,
        COUNT(r.id) as total_rooms,
        COALESCE(SUM(CASE WHEN r.status = 'rented' THEN 1 ELSE 0 END), 0) as rented_rooms,
        COALESCE(SUM(CASE WHEN r.status = 'empty' THEN 1 ELSE 0 END), 0) as empty_rooms,
        COALESCE(SUM(CASE WHEN r.status = 'rented' THEN r.base_price ELSE 0 END), 0) as total_revenue
    FROM properties p
    LEFT JOIN rooms r ON p.id = r.property_id
    GROUP BY p.id
    ORDER BY p.id ASC
    """
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        item = dict(r)
        total = item.get("total_rooms") or 0
        rented = item.get("rented_rooms") or 0
        item["occupancy_rate"] = round((rented / total * 100), 1) if total > 0 else 0.0
        result.append(item)

    return result

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        p.*,
        COUNT(r.id) as total_rooms,
        COALESCE(SUM(CASE WHEN r.status = 'rented' THEN 1 ELSE 0 END), 0) as rented_rooms,
        COALESCE(SUM(CASE WHEN r.status = 'empty' THEN 1 ELSE 0 END), 0) as empty_rooms,
        COALESCE(SUM(CASE WHEN r.status = 'rented' THEN r.base_price ELSE 0 END), 0) as total_revenue
    FROM properties p
    LEFT JOIN rooms r ON p.id = r.property_id
    WHERE p.id = ?
    GROUP BY p.id
    """, (property_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy căn hộ / tòa nhà")

    item = dict(row)
    total = item.get("total_rooms") or 0
    rented = item.get("rented_rooms") or 0
    item["occupancy_rate"] = round((rented / total * 100), 1) if total > 0 else 0.0
    return item

@router.post("", response_model=PropertyResponse)
def create_property(prop: PropertyCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO properties (name, code, address, total_floors, property_type, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        prop.name,
        prop.code or "",
        prop.address or "",
        prop.total_floors or 1,
        prop.property_type or "apartment",
        prop.notes or ""
    ))
    prop_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM properties WHERE id = ?", (prop_id,))
    row = cursor.fetchone()
    conn.close()
    item = dict(row)
    item["total_rooms"] = 0
    item["rented_rooms"] = 0
    item["empty_rooms"] = 0
    item["occupancy_rate"] = 0.0
    item["total_revenue"] = 0.0
    return item

@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: int, prop: PropertyUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM properties WHERE id = ?", (property_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy căn hộ / tòa nhà")

    fields = []
    values = []
    for k, v in prop.model_dump(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)

    if fields:
        values.append(property_id)
        cursor.execute(f"UPDATE properties SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    cursor.execute("""
    SELECT 
        p.*,
        COUNT(r.id) as total_rooms,
        COALESCE(SUM(CASE WHEN r.status = 'rented' THEN 1 ELSE 0 END), 0) as rented_rooms,
        COALESCE(SUM(CASE WHEN r.status = 'empty' THEN 1 ELSE 0 END), 0) as empty_rooms,
        COALESCE(SUM(CASE WHEN r.status = 'rented' THEN r.base_price ELSE 0 END), 0) as total_revenue
    FROM properties p
    LEFT JOIN rooms r ON p.id = r.property_id
    WHERE p.id = ?
    GROUP BY p.id
    """, (property_id,))
    row = cursor.fetchone()
    conn.close()

    item = dict(row)
    total = item.get("total_rooms") or 0
    rented = item.get("rented_rooms") or 0
    item["occupancy_rate"] = round((rented / total * 100), 1) if total > 0 else 0.0
    return item

@router.delete("/{property_id}")
def delete_property(property_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name FROM properties WHERE id = ?", (property_id,))
    prop = cursor.fetchone()
    if not prop:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy căn hộ / tòa nhà")

    # Kiểm tra xem có phòng nào đang có hợp đồng active không
    cursor.execute("""
    SELECT COUNT(*) FROM contracts c
    JOIN rooms r ON c.room_id = r.id
    WHERE r.property_id = ? AND c.status = 'active'
    """, (property_id,))
    active_count = cursor.fetchone()[0]
    if active_count > 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Căn hộ/Tòa nhà này vẫn còn hợp đồng thuê đang hoạt động! Hãy kết thúc hoặc chuyển hợp đồng trước khi xóa.")

    try:
        # Xóa các phòng và dữ liệu liên quan
        cursor.execute("SELECT id FROM rooms WHERE property_id = ?", (property_id,))
        room_ids = [r["id"] for r in cursor.fetchall()]
        for r_id in room_ids:
            cursor.execute("DELETE FROM reminders WHERE related_room_id = ?", (r_id,))
            cursor.execute("DELETE FROM invoices WHERE room_id = ?", (r_id,))
            cursor.execute("DELETE FROM contracts WHERE room_id = ?", (r_id,))
        cursor.execute("DELETE FROM rooms WHERE property_id = ?", (property_id,))
        cursor.execute("DELETE FROM properties WHERE id = ?", (property_id,))
        conn.commit()
        return {"success": True, "message": f"Đã xóa căn hộ/tòa nhà '{prop['name']}' thành công"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa: {str(e)}")
    finally:
        conn.close()
