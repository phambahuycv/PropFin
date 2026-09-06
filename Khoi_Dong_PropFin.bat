@echo off
chcp 65001 > nul
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
cd /d "%~dp0"
title PropFin - Quản lý Chi tiêu ^& Nhà trọ Cho thuê
color 0A

echo ======================================================================
echo          PROPFIN - QUẢN LÝ CHI TIÊU ^& NHÀ TRỌ CHO THUÊ
echo ======================================================================
echo.
echo [*] Đang kiểm tra môi trường Python trên máy...

:: 1. Thử lệnh python thông thường
set PY_CMD=python
python --version >nul 2>&1
if %errorlevel% equ 0 goto :FOUND_PYTHON

:: 2. Thử trình khởi chạy py launcher của Windows
py --version >nul 2>&1
if %errorlevel% equ 0 (
    set PY_CMD=py
    goto :FOUND_PYTHON
)

:: 3. Chưa có Python: Hỗ trợ người dùng tự động hoặc thủ công
color 0C
echo.
echo ======================================================================
echo [!] CHÚ Ý: MÁY TÍNH CỦA BẠN CHƯA CÀI ĐẶT PYTHON!
echo ======================================================================
echo.
echo Ứng dụng PropFin cần môi trường Python (hoàn toàn miễn phí) để chạy.
echo.

where winget >nul 2>&1
if %errorlevel% equ 0 (
    echo [TỰ ĐỘNG CÀI ĐẶT] Windows của bạn có sẵn công cụ Microsoft Winget.
    echo Bạn có muốn PropFin tự động tải ^& cài đặt Python chính thức cho bạn không?
    set /p AUTO_INSTALL=">> Nhập Y để đồng ý cài tự động, hoặc N để tự tải thủ công (Y/N, mặc định Y): "
    if /i "%AUTO_INSTALL%"=="n" goto :MANUAL_INSTALL
    
    echo.
    echo [*] Đang tự động tải và cài đặt Python từ nguồn chính thức của Microsoft...
    echo [*] Vui lòng chờ 1-2 phút (nếu có hộp thoại Windows UAC hỏi quyền, hãy chọn Yes)...
    winget install --id Python.Python.3.11 -e --source winget --accept-package-agreements --accept-source-agreements
    
    echo.
    echo [*] Đã hoàn tất cài đặt Python!
    echo [*] Vui lòng TẮT cửa sổ này và BẤM ĐÚP LẠI vào file Khoi_Dong_PropFin.bat để bắt đầu dùng!
    echo.
    pause
    exit /b 0
)

:MANUAL_INSTALL
echo [CÀI ĐẶT THỦ CÔNG - 3 BƯỚC ĐƠN GIẢN]
echo  1. Trình duyệt sẽ mở trang chính thức: https://www.python.org/downloads/
echo  2. Nhấp nút màu vàng "Download Python 3.x.x" và mở file vừa tải về.
echo  3. [CỰC KỲ QUAN TRỌNG]: TÍCH CHỌN VÀO Ô "Add python.exe to PATH" ở dưới cùng!
echo  4. Nhấn nút "Install Now". Sau khi cài xong, bấm lại vào file Khoi_Dong_PropFin.bat này!
echo.
start https://www.python.org/downloads/
pause
exit /b 1

:FOUND_PYTHON
color 0A
echo [✓] Đã tìm thấy Python:
%PY_CMD% --version
echo.
echo [*] Đang kiểm tra và cài đặt các thư viện cần thiết (FastAPI, Uvicorn...)...
%PY_CMD% -m pip install -r requirements.txt --quiet

echo.
echo ======================================================================
echo [✓] Khởi chạy ứng dụng PropFin thành công!
echo [*] Trình duyệt web sẽ tự động mở trang quản lý sau 1-2 giây.
echo [*] Địa chỉ truy cập: http://127.0.0.1:8000
echo ======================================================================
echo.
%PY_CMD% run.py

if %errorlevel% neq 0 (
    echo.
    echo [!] Ứng dụng đã dừng lại hoặc có lỗi phát sinh.
    pause
)

