@echo off
chcp 65001 > nul
echo [*] Đang tạo Shortcut ứng dụng PropFin ra Desktop...

set SCRIPT="%TEMP%\CreateShortcut.vbs"
set TARGET_BAT=%~dp0Khoi_Dong_PropFin.bat
set WORK_DIR=%~dp0

echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\PropFin - Quản lý Chi tiêu & Nhà trọ.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%TARGET_BAT%" >> %SCRIPT%
echo oLink.WorkingDirectory = "%WORK_DIR%" >> %SCRIPT%
echo oLink.Description = "PropFin - Quản lý Chi tiêu Cá nhân và Quản lý Nhà trọ" >> %SCRIPT%
echo oLink.IconLocation = "shell32.dll, 220" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

echo [✓] Đã tạo Shortcut thành công trên Desktop của bạn!
echo Giờ đây bạn có thể nhấn trực tiếp vào biểu tượng PropFin ngoài Desktop để dùng app.
echo.
pause
