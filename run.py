import os
import sys

# Đảm bảo hiển thị tiếng Việt trên Windows console không bị lỗi mã hóa
if sys.platform == "win32":
    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if sys.stderr and hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import webbrowser
import threading
import time
import socket
from pathlib import Path

# Thêm thư mục backend vào sys.path
CURRENT_DIR = Path(__file__).parent.resolve()
BACKEND_DIR = CURRENT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import uvicorn

def is_port_in_use(port, host="127.0.0.1"):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0

def find_available_port(start_port=8000, host="127.0.0.1"):
    port = start_port
    while port < start_port + 50:
        if not is_port_in_use(port, host):
            return port
        port += 1
    return start_port

def open_browser(url):
    time.sleep(1.2)
    print(f" Đang mở trình duyệt tại: {url}")
    webbrowser.open(url)

if __name__ == "__main__":
    host = "127.0.0.1"
    port = find_available_port(8000, host)
    app_url = f"http://{host}:{port}"

    print("=" * 65)
    print("        PROPFIN - QUẢN LÝ CHI TIÊU & NHÀ TRỌ CHO THUÊ")
    print("=" * 65)
    print(f" [✓] Máy chủ ứng dụng: {app_url}")
    print(" [✓] Tự động mở trình duyệt web...")
    print(" [i] Nhấn Ctrl + C để dừng máy chủ bất cứ lúc nào.")
    print("=" * 65)

    threading.Thread(target=open_browser, args=(app_url,), daemon=True).start()
    uvicorn.run("backend.app:app", host=host, port=port, reload=False, log_level="info")
