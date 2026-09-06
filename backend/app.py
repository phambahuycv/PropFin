import os
import sys
from pathlib import Path

# Đảm bảo thư mục backend luôn nằm trong sys.path
CURRENT_DIR = Path(__file__).parent.resolve()
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import init_db
from seed_data import seed_database
from routers import (
    wallets,
    categories,
    transactions,
    properties,
    rooms,
    contracts,
    invoices,
    reminders,
    analytics
)

# Khởi tạo Database và dữ liệu mẫu nếu cần
init_db()
seed_database()

app = FastAPI(
    title="PropFin - Quản lý Chi tiêu & Nhà trọ Cho thuê",
    description="Hệ thống Quản lý Tài chính Cá nhân và Vận hành Phòng trọ toàn diện",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(wallets.router)
app.include_router(categories.router)
app.include_router(transactions.router)
app.include_router(properties.router)
app.include_router(rooms.router)
app.include_router(contracts.router)
app.include_router(invoices.router)
app.include_router(reminders.router)
app.include_router(analytics.router)

# Mount Frontend static files
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"

if FRONTEND_DIR.exists():
    app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
    app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")

@app.get("/")
def serve_index():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "PropFin API running. Frontend folder not found."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
