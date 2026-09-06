from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database import get_db_connection
from models import TransactionCreate, TransactionUpdate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    month: Optional[str] = Query(None, description="Format: YYYY-MM"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    type: Optional[str] = None,
    category_id: Optional[int] = None,
    wallet_id: Optional[int] = None,
    group_name: Optional[str] = None,
    limit: int = 200
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        t.*,
        c.name as category_name,
        c.group_name as category_group,
        w.name as wallet_name,
        w2.name as destination_wallet_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN wallets w ON t.wallet_id = w.id
    LEFT JOIN wallets w2 ON t.destination_wallet_id = w2.id
    WHERE 1=1
    """
    params = []

    if month:
        query += " AND t.transaction_date LIKE ?"
        params.append(f"{month}%")
    if date_from:
        query += " AND date(t.transaction_date) >= date(?)"
        params.append(date_from)
    if date_to:
        query += " AND date(t.transaction_date) <= date(?)"
        params.append(date_to)
    if type:
        query += " AND t.type = ?"
        params.append(type)
    if category_id:
        query += " AND t.category_id = ?"
        params.append(category_id)
    if wallet_id:
        query += " AND (t.wallet_id = ? OR t.destination_wallet_id = ?)"
        params.append(wallet_id)
        params.append(wallet_id)
    if group_name:
        query += " AND c.group_name = ?"
        params.append(group_name)

    query += " ORDER BY t.transaction_date DESC, t.id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("", response_model=TransactionResponse)
def create_transaction(tx: TransactionCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Cập nhật số dư ví
        if tx.type == "expense":
            cursor.execute("UPDATE wallets SET balance = balance - ? WHERE id = ?", (tx.amount, tx.wallet_id))
        elif tx.type == "income":
            cursor.execute("UPDATE wallets SET balance = balance + ? WHERE id = ?", (tx.amount, tx.wallet_id))
        elif tx.type == "transfer":
            if not tx.destination_wallet_id:
                raise HTTPException(status_code=400, detail="Vui lòng chọn ví đích nhận tiền")
            cursor.execute("UPDATE wallets SET balance = balance - ? WHERE id = ?", (tx.amount, tx.wallet_id))
            cursor.execute("UPDATE wallets SET balance = balance + ? WHERE id = ?", (tx.amount, tx.destination_wallet_id))

        cursor.execute("""
        INSERT INTO transactions (title, amount, type, category_id, wallet_id, destination_wallet_id, transaction_date, notes, ref_invoice_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (tx.title, tx.amount, tx.type, tx.category_id, tx.wallet_id, tx.destination_wallet_id, tx.transaction_date, tx.notes or "", tx.ref_invoice_id))
        tx_id = cursor.lastrowid
        conn.commit()

        cursor.execute("""
        SELECT 
            t.*,
            c.name as category_name,
            c.group_name as category_group,
            w.name as wallet_name,
            w2.name as destination_wallet_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN wallets w ON t.wallet_id = w.id
        LEFT JOIN wallets w2 ON t.destination_wallet_id = w2.id
        WHERE t.id = ?
        """, (tx_id,))
        row = cursor.fetchone()
        return dict(row)
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
    tx = cursor.fetchone()
    if not tx:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch")

    # Hoàn lại số dư ví
    amount = tx["amount"]
    tx_type = tx["type"]
    wallet_id = tx["wallet_id"]
    dest_wallet_id = tx["destination_wallet_id"]

    if tx_type == "expense":
        cursor.execute("UPDATE wallets SET balance = balance + ? WHERE id = ?", (amount, wallet_id))
    elif tx_type == "income":
        cursor.execute("UPDATE wallets SET balance = balance - ? WHERE id = ?", (amount, wallet_id))
    elif tx_type == "transfer" and dest_wallet_id:
        cursor.execute("UPDATE wallets SET balance = balance + ? WHERE id = ?", (amount, wallet_id))
        cursor.execute("UPDATE wallets SET balance = balance - ? WHERE id = ?", (amount, dest_wallet_id))

    cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Đã xóa giao dịch thành công"}
