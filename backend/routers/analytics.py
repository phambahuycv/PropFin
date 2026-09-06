from fastapi import APIRouter, Query
from typing import Optional
from database import get_db_connection
from datetime import datetime, date

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview(month: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    today = date.today()
    target_month = month or today.strftime("%Y-%m")

    # 1. Tổng thu, chi trong tháng
    cursor.execute("""
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
    FROM transactions
    WHERE transaction_date LIKE ?
    """, (f"{target_month}%",))
    tx_summary = cursor.fetchone()
    total_income = tx_summary["total_income"]
    total_expense = tx_summary["total_expense"]
    net_cashflow = total_income - total_expense

    # 2. Số dư các ví
    cursor.execute("SELECT id, name, type, balance, bank_name, account_number, account_holder FROM wallets")
    wallets = [dict(w) for w in cursor.fetchall()]
    total_balance = sum(w["balance"] for w in wallets)
    bank_balance = sum(w["balance"] for w in wallets if w["type"] == "bank")
    cash_balance = sum(w["balance"] for w in wallets if w["type"] == "cash")

    # 3. Thống kê phòng trọ
    cursor.execute("""
    SELECT 
        COUNT(*) as total_rooms,
        COALESCE(SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END), 0) as rented_rooms,
        COALESCE(SUM(CASE WHEN status = 'empty' THEN 1 ELSE 0 END), 0) as empty_rooms,
        COALESCE(SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END), 0) as maintenance_rooms
    FROM rooms
    """)
    room_stats = dict(cursor.fetchone())
    total_rooms = room_stats["total_rooms"]
    rented_rooms = room_stats["rented_rooms"]
    occupancy_rate = round((rented_rooms / total_rooms * 100), 1) if total_rooms > 0 else 0.0
    room_stats["occupancy_rate"] = occupancy_rate

    # 4. Thống kê doanh thu tiền trọ tháng này
    cursor.execute("""
    SELECT 
        COALESCE(SUM(total_amount), 0) as total_billed,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN paid_amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN payment_status = 'unpaid' THEN total_amount ELSE 0 END), 0) as total_unpaid,
        COUNT(*) as total_invoices,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END), 0) as paid_count,
        COALESCE(SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END), 0) as unpaid_count
    FROM invoices
    WHERE billing_month = ?
    """, (target_month,))
    invoice_stats = dict(cursor.fetchone())

    # Doanh thu ước tính theo hợp đồng active
    cursor.execute("SELECT COALESCE(SUM(rent_price), 0) as estimated_rent FROM contracts WHERE status = 'active'")
    estimated_rent = cursor.fetchone()["estimated_rent"]

    # 5. Nhắc nhở chưa hoàn thành
    cursor.execute("SELECT COUNT(*) as pending_reminders FROM reminders WHERE is_completed = 0")
    pending_reminders = cursor.fetchone()["pending_reminders"]

    conn.close()
    return {
        "month": target_month,
        "total_income": total_income,
        "total_expense": total_expense,
        "net_cashflow": net_cashflow,
        "total_balance": total_balance,
        "bank_balance": bank_balance,
        "cash_balance": cash_balance,
        "wallets": wallets,
        "room_stats": room_stats,
        "invoice_stats": invoice_stats,
        "estimated_rent_monthly": estimated_rent,
        "pending_reminders": pending_reminders
    }

@router.get("/cashflow-monthly")
def get_monthly_cashflow(year: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    target_year = year or str(date.today().year)

    cursor.execute("""
    SELECT 
        strftime('%m', transaction_date) as month_num,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
    FROM transactions
    WHERE strftime('%Y', transaction_date) = ?
    GROUP BY strftime('%m', transaction_date)
    ORDER BY month_num ASC
    """, (target_year,))
    rows = cursor.fetchall()
    conn.close()

    months_data = {f"{i:02d}": {"month": f"T{i}", "income": 0.0, "expense": 0.0, "net": 0.0} for i in range(1, 13)}
    for r in rows:
        m = r["month_num"]
        if m in months_data:
            months_data[m]["income"] = r["income"]
            months_data[m]["expense"] = r["expense"]
            months_data[m]["net"] = r["income"] - r["expense"]

    return list(months_data.values())

@router.get("/expenses-by-category")
def get_expenses_by_category(month: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    target_month = month or date.today().strftime("%Y-%m")

    cursor.execute("""
    SELECT 
        c.group_name,
        c.name as category_name,
        c.color,
        c.icon,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(t.id) as transaction_count
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'expense' AND t.transaction_date LIKE ?
    GROUP BY c.group_name, c.name
    ORDER BY total_amount DESC
    """, (f"{target_month}%",))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/incomes-by-source")
def get_incomes_by_source(month: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    target_month = month or date.today().strftime("%Y-%m")

    cursor.execute("""
    SELECT 
        c.group_name,
        c.name as category_name,
        c.color,
        c.icon,
        COALESCE(SUM(t.amount), 0) as total_amount,
        COUNT(t.id) as transaction_count
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'income' AND t.transaction_date LIKE ?
    GROUP BY c.group_name, c.name
    ORDER BY total_amount DESC
    """, (f"{target_month}%",))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/property-summary")
def get_property_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Thống kê theo từng tầng
    cursor.execute("""
    SELECT 
        floor,
        COUNT(*) as total_rooms,
        COALESCE(SUM(CASE WHEN position = 'outside' THEN 1 ELSE 0 END), 0) as outside_rooms,
        COALESCE(SUM(CASE WHEN position = 'inside' THEN 1 ELSE 0 END), 0) as inside_rooms,
        COALESCE(SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END), 0) as rented_rooms,
        COALESCE(SUM(CASE WHEN status = 'empty' THEN 1 ELSE 0 END), 0) as empty_rooms,
        COALESCE(SUM(base_price), 0) as potential_revenue
    FROM rooms
    GROUP BY floor
    ORDER BY floor ASC
    """)
    floor_stats = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "floor_stats": floor_stats
    }
