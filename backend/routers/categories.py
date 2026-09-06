from fastapi import APIRouter, HTTPException
from typing import List, Optional
from database import get_db_connection
from models import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(type: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if type:
        cursor.execute("SELECT * FROM categories WHERE type = ? ORDER BY group_name, name", (type,))
    else:
        cursor.execute("SELECT * FROM categories ORDER BY type DESC, group_name, name")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("", response_model=CategoryResponse)
def create_category(cat: CategoryCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO categories (name, type, group_name, icon, color, is_system)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (cat.name, cat.type, cat.group_name, cat.icon or 'tag', cat.color or '#4f46e5', 0))
    cat_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM categories WHERE id = ?", (cat_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

@router.delete("/{category_id}")
def delete_category(category_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE category_id = ?", (category_id,))
    if cursor.fetchone()[0] > 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Không thể xóa danh mục đã có giao dịch phát sinh.")
    cursor.execute("DELETE FROM categories WHERE id = ?", (category_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Đã xóa danh mục"}
