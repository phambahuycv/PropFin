from fastapi import APIRouter, HTTPException
from typing import List
from database import get_db_connection
from models import WalletCreate, WalletUpdate, WalletResponse

router = APIRouter(prefix="/api/wallets", tags=["Wallets"])

POPULAR_BANKS = [
    {"code": "MB", "name": "MB Bank (Quân Đội)"},
    {"code": "VCB", "name": "Vietcombank (Ngoại Thương)"},
    {"code": "TCB", "name": "Techcombank (Kỹ Thương)"},
    {"code": "VPB", "name": "VPBank (Việt Nam Thịnh Vượng)"},
    {"code": "TPB", "name": "TPBank (Tiên Phong)"},
    {"code": "ACB", "name": "ACB (Á Châu)"},
    {"code": "BIDV", "name": "BIDV (Đầu Tư & Phát Triển)"},
    {"code": "CTG", "name": "VietinBank (Công Thương)"},
    {"code": "VBA", "name": "Agribank (Nông Nghiệp)"},
    {"code": "STB", "name": "Sacombank (Sài Gòn Thương Tín)"},
    {"code": "VIB", "name": "VIB (Quốc Tế)"},
    {"code": "HDB", "name": "HDBank (Phát Triển TP.HCM)"},
    {"code": "OCB", "name": "OCB (Phương Đông)"},
    {"code": "SHB", "name": "SHB (Sài Gòn - Hà Nội)"},
    {"code": "MSB", "name": "MSB (Hàng Hải)"}
]

@router.get("/banks")
def get_popular_banks():
    return POPULAR_BANKS

@router.get("", response_model=List[WalletResponse])
def get_wallets():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM wallets ORDER BY is_default DESC, id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("", response_model=WalletResponse)
def create_wallet(wallet: WalletCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    if wallet.is_default:
        cursor.execute("UPDATE wallets SET is_default = 0")
    cursor.execute("""
    INSERT INTO wallets (name, type, balance, account_number, bank_code, bank_name, account_holder, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (wallet.name, wallet.type, wallet.balance, wallet.account_number, wallet.bank_code, wallet.bank_name, wallet.account_holder, wallet.is_default))
    wallet_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM wallets WHERE id = ?", (wallet_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

@router.put("/{wallet_id}", response_model=WalletResponse)
def update_wallet(wallet_id: int, wallet: WalletUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM wallets WHERE id = ?", (wallet_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản/ví")

    if wallet.is_default:
        cursor.execute("UPDATE wallets SET is_default = 0")

    fields = []
    values = []
    for k, v in wallet.model_dump(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)

    if fields:
        values.append(wallet_id)
        cursor.execute(f"UPDATE wallets SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    cursor.execute("SELECT * FROM wallets WHERE id = ?", (wallet_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

@router.delete("/{wallet_id}")
def delete_wallet(wallet_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE wallet_id = ?", (wallet_id,))
    if cursor.fetchone()[0] > 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Không thể xóa ví đã có giao dịch liên kết. Hãy chuyển giao dịch sang ví khác trước.")

    cursor.execute("DELETE FROM wallets WHERE id = ?", (wallet_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Đã xóa ví thành công"}
