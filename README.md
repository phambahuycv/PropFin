# 🏢 PropFin - Quản Lý Chi Tiêu Cá Nhân & Nhà Trọ Cho Thuê

<p align="center">
  <b>Hệ thống phần mềm quản lý tài chính toàn diện kết hợp giữa Quản lý Thu - Chi cá nhân & Vận hành Nhà trọ / Căn hộ cho thuê chuyên sâu.</b>
  <br>
  <i>Tích hợp sơ đồ phòng, chốt điện nước, xuất hóa đơn VietQR động, gửi Zalo 1-click và báo cáo tài chính trực quan.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-blue.svg" alt="Python 3.9+">
  <img src="https://img.shields.io/badge/FastAPI-Modern_Backend-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/SQLite-Zero_Config-003B57.svg" alt="SQLite">
  <img src="https://img.shields.io/badge/VietQR-Auto_Generate-005BAA.svg" alt="VietQR">
  <img src="https://img.shields.io/badge/Platform-Windows_1-Click-success.svg" alt="Windows 1-Click">
</p>

---

## ⚡ HƯỚNG DẪN CHO NGƯỜI DÙNG PHỔ THÔNG (3 BƯỚC CỰC DỄ)
> **Dành cho tất cả mọi người**: Bạn **KHÔNG CẦN BIẾT LẬP TRÌNH**, máy tính **CHƯA CÓ PYTHON** và **KHÔNG CẦN CÀI GIT** vẫn sử dụng được 100%!

```
  ┌─────────────────┐      ┌─────────────────────────┐      ┌────────────────────────┐
  │  1. Tải file ZIP│ ───► │  2. Giải nén thư mục    │ ───► │ 3. Bấm Khoi_Dong.bat   │
  │  (Từ GitHub)    │      │  (Chuột phải -> Extract)│      │    (Ứng dụng tự chạy!) │
  └─────────────────┘      └─────────────────────────┘      └────────────────────────┘
```

### 📥 Bước 1: Tải ứng dụng về máy tính (Không cần Git)
1. Ở đầu trang GitHub này, nhấp vào nút màu xanh lá cây **`<> Code`** (ở góc trên bên phải).
2. Chọn **`Download ZIP`** (Tải file nén .ZIP về máy).
3. Sau khi tải xong, nhấp chuột phải vào file `.zip` vừa tải $\rightarrow$ Chọn **`Extract All...`** (hoặc *Giải nén tập tin...*).
4. Mở thư mục **`PropFin`** vừa giải nén ra.

---

### 🚀 Bước 2: Khởi động ứng dụng (1 Cú Click Chuột)
Trong thư mục vừa giải nén, bạn tìm và **nhấp đúp chuột vào file**:
👉 **`Khoi_Dong_PropFin.bat`**

Hệ thống sẽ tự động làm toàn bộ mọi việc cho bạn:
* **Nếu máy bạn đã có Python**: Ứng dụng sẽ tự động tải thư viện cần thiết và **tự mở trình duyệt web** tại địa chỉ `http://127.0.0.1:8000`. Bạn có thể dùng ngay lập tức!
* **Nếu máy bạn CHƯA CÓ Python**: Cửa sổ sẽ thông báo và hỗ trợ bạn theo 1 trong 2 cách:
  * **Cách A (Tự động - Khuyên dùng)**: Nhập chữ `Y` rồi nhấn `Enter`. Windows sẽ tự động tải và cài đặt Python từ nguồn chính thức của Microsoft. Khi cài xong, bạn chỉ cần bấm lại vào `Khoi_Dong_PropFin.bat`!
  * **Cách B (Thủ công - 1 phút)**: Cửa sổ sẽ tự mở trang web [python.org/downloads](https://www.python.org/downloads/). Bạn bấm nút vàng **Download Python**, mở file cài đặt lên.
    > ⚠️ **LƯU Ý CỰC KỲ QUAN TRỌNG KHI CÀI PYTHON THỦ CÔNG**:
    > Ở màn hình đầu tiên của bộ cài, bạn **BẮT BUỘC PHẢI TÍCH VÀO Ô VUÔNG**:
    > ☑️ **`Add python.exe to PATH`** (ở góc dưới cùng).
    > Sau đó bấm **`Install Now`**. Cài xong, bạn bấm lại vào `Khoi_Dong_PropFin.bat` là xong!

---

### 🖥️ Bước 3 (Tùy chọn): Tạo biểu tượng mở nhanh ngoài màn hình Desktop
Trong thư mục, bạn bấm đúp vào file:
👉 **`Tao_Shortcut_Desktop.bat`**

Một biểu tượng có tên **"PropFin - Quản lý Chi tiêu & Nhà trọ"** sẽ xuất hiện ngay trên màn hình Desktop của bạn. Từ lần sau, bạn chỉ cần bấm vào biểu tượng ngoài màn hình là ứng dụng tự mở như một phần mềm chuyên nghiệp!

---

## 💻 DÀNH CHO LẬP TRÌNH VIÊN (DEVELOPERS)

Nếu bạn đã có sẵn `git` và `python` trên máy:

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/PropFin.git
cd PropFin

# 2. Tạo môi trường ảo (khuyên dùng)
python -m venv venv
venv\Scripts\activate     # Trên Windows
# source venv/bin/activate # Trên Linux / macOS

# 3. Cài đặt thư viện
pip install -r requirements.txt

# 4. Khởi chạy ứng dụng
python run.py
```
Ứng dụng sẽ chạy tại `http://127.0.0.1:8000` (hoặc cổng trống tiếp theo nếu cổng 8000 bận).

---

## 🌟 CÁC TÍNH NĂNG NỔI BẬT CỦA PROPFIN

### 1. 💳 Quản Lý Ví Tiền Linh Hoạt (Ngân Hàng & Tiền Mặt Riêng Biệt)
* **Tài khoản Ngân hàng**:
  * Tích hợp danh mục **15 ngân hàng lớn tại Việt Nam** (Vietcombank, MB, Techcombank, BIDV, ACB, VPBank, TPBank, Sacombank, v.v.).
  * Lưu số tài khoản, tên chủ thẻ, chi nhánh.
  * Tích chọn **"Đặt làm tài khoản VietQR mặc định"** để hệ thống tự động sinh mã QR chuyển khoản khi xuất hóa đơn thu tiền nhà.
  * Giao diện dạng **Thẻ ATM sang trọng**.
* **Ví Tiền mặt**:
  * Tạo các ví tiền mặt độc lập (ví dụ: *Tiền mặt két sắt*, *Tiền thu trực tiếp*).
  * Theo dõi số dư tiền mặt tức thì.
* **Chuyển tiền nội bộ**: Chuyển khoản qua lại giữa các ví (ví dụ: Rút tiền từ ngân hàng về ví tiền mặt hoặc ngược lại).

---

### 2. 🏠 Vận Hành Nhà Trọ Cho Thuê (3 Phân Vùng Độc Lập)
Hệ thống cho thuê được tổ chức bài bản thành 3 màn hình riêng biệt, chuyển đổi qua lại nhanh chóng bằng thanh điều hướng:

1. **🏢 Căn Hộ / Tòa Nhà (Properties)**:
   * Quản lý nhiều cơ sở: Tòa nhà / Dãy trọ, Căn hộ chung cư, Nhà nguyên căn, Mặt bằng kinh doanh.
   * Thống kê trực quan: Mã căn, địa chỉ, số tầng, **tổng số phòng**, **số phòng đang thuê**, **tỷ lệ lấp đầy (%)**, và **tổng doanh thu dự kiến hàng tháng**.
   * Nút bấm nhanh: *"Xem danh sách phòng của căn này"* và *"+ Thêm phòng vào căn này"*.

2. **🚪 Sơ Đồ Phòng Riêng (Rooms)**:
   * Hiển thị danh sách phòng trực quan với màu sắc trạng thái rõ ràng:
     * 🟢 **Còn trống**: Sẵn sàng đón khách mới.
     * 🔵 **Đang cho thuê**: Đang có hợp đồng thuê hoạt động.
     * 🟡 **Đang bảo trì**: Đang sửa chữa, nâng cấp.
   * **Bộ lọc theo Căn hộ / Tòa nhà**: Xem toàn bộ hoặc lọc riêng theo từng căn hộ.
   * Huy hiệu tên Tòa nhà/Căn hộ hiển thị ngay trên từng thẻ phòng.

3. **📝 Quản Lý Hợp Đồng Riêng (Contracts)**:
   * Bảng dữ liệu độc lập theo dõi toàn diện hợp đồng thuê nhà.
   * Thống kê nhanh: Số hợp đồng đang hiệu lực, số hợp đồng sắp hết hạn trong 30 ngày, hợp đồng đã thanh lý.
   * Nút **`+ Lập Hợp Đồng Mới`** độc lập:
     * **Bước 1**: Chọn Căn hộ / Tòa nhà.
     * **Bước 2**: Hệ thống **tự động lọc ra các phòng đang CÒN TRỐNG** thuộc căn hộ đó.
     * **Bước 3**: Điền thông tin khách thuê (Họ tên, SĐT, CCCD), giá thuê, tiền cọc, ngày bắt đầu - kết thúc, ngày thu tiền.
   * Khi kích hoạt: Tự động chuyển trạng thái phòng sang "Đang thuê" và cộng tiền cọc vào ví được chọn.

---

### 3. ⚡ Chốt Điện Nước & Sinh Hóa Đơn VietQR Tự Động
* **Nhập số điện nước**: Chỉ cần nhập số điện mới và số nước mới, hệ thống tự động trừ đi số cũ và nhân theo đơn giá trong hợp đồng.
* **Tự động tính dịch vụ đi kèm**: Internet, rác, phí gửi xe, phụ phí khác.
* **Mã VietQR động chuẩn Napas**: Khi xuất hóa đơn, hệ thống tự tạo mã VietQR có sẵn số tiền chính xác, tên chủ tài khoản và nội dung chuyển khoản (*Ví dụ: CL6131 TIEN PHONG T09*). Khách chỉ cần mở app ngân hàng quét là xong!
* **1-Click Copy tin nhắn Zalo**: Mẫu tin nhắn thông báo tiền phòng được định dạng sẵn, bạn chỉ cần bấm **"Sao chép tin nhắn Zalo"** rồi dán gửi cho khách.
* **Ghi nhận thanh toán**: Khi khách thanh toán, bấm **"Xác nhận đã thu"** $\rightarrow$ Tiền tự động cộng vào Ví đã chọn và tạo bản ghi Thu nhập trên hệ thống.

---

### 4. 📊 Quản Lý Thu - Chi Cá Nhân & Gia Đình
* **Phân loại danh mục rõ ràng**:
  * *Khoản Chi*: Marketing (Dụng cụ/thiết bị, nhân lực/thuê ngoài, quảng cáo), Tiêu dùng cá nhân (Ăn uống, sinh hoạt, mua sắm, xăng xe, y tế), Đối nội - Đối ngoại (Hiếu hỉ, thăm hỏi họ hàng, quà biếu), Học tập & Phát triển, Tiết kiệm & Đầu tư, Vận hành nhà trọ.
  * *Khoản Thu*: Tiền phòng trọ, Tiền cọc trọ, Lương công ty, Lương vợ/chồng, Thưởng, Thu nhập kinh doanh ngoài.
* **Bộ lọc thông minh**: Lọc theo khoảng ngày, theo ví tiền, theo danh mục thu/chi.

---

### 5. ⏰ Trung Tâm Nhắc Hẹn & Cảnh Báo Thông Minh
* Tự động nhắc đến ngày thu tiền trọ định kỳ hàng tháng.
* Cảnh báo hợp đồng sắp hết hạn trước 30 ngày để chủ nhà chủ động liên hệ tái ký hoặc tìm khách mới.
* Cho phép tạo nhắc hẹn cá nhân (đóng lãi ngân hàng, bảo dưỡng máy lạnh, kiểm tra định kỳ...).

---

### 6. 📈 Báo Cáo & Thống Kê Tài Chính Trực Quan
* Biểu đồ Dòng tiền 12 tháng (Tổng Thu vs Tổng Chi vs Lợi nhuận ròng).
* Biểu đồ tỷ lệ phân bổ chi tiêu theo nhóm danh mục.
* Biểu đồ cơ cấu nguồn thu nhập.
* Xuất dữ liệu ra file Excel / CSV bất cứ lúc nào.

---

## 📱 CÁCH DÙNG TRÊN ĐIỆN THOẠI (CÙNG MẠNG WIFI)

Rất tiện lợi khi bạn đi kiểm tra phòng, chốt số điện nước trực tiếp bằng điện thoại:

1. Đảm bảo máy tính chạy PropFin và điện thoại của bạn **đang kết nối chung một mạng Wi-Fi**.
2. Trên máy tính, mở cửa sổ Command Prompt (`cmd`) và gõ lệnh: `ipconfig`
3. Tìm dòng **`IPv4 Address`** (ví dụ: `192.168.1.15`).
4. Trên điện thoại, mở trình duyệt (Safari / Chrome) và gõ:
   👉 **`http://192.168.1.15:8000`** *(thay bằng IP máy bạn)*
5. Bạn có thể sử dụng đầy đủ mọi tính năng mượt mà ngay trên điện thoại!

---

## 💾 HƯỚNG DẪN SAO LƯU DỮ LIỆU (BACKUP) AN TOÀN

Toàn bộ dữ liệu (thu chi, căn hộ, phòng, hợp đồng, ví tiền) được lưu trong 1 file duy nhất:
📁 **`propfin.db`** (nằm ngay trong thư mục gốc của ứng dụng).

* **Cách sao lưu (Backup)**: Bạn chỉ cần copy file `propfin.db` cất vào USB, Google Drive hoặc một thư mục an toàn khác.
* **Cách khôi phục**: Khi đổi máy tính hoặc cài lại máy, chỉ cần dán file `propfin.db` này vào thư mục ứng dụng là toàn bộ dữ liệu sẽ nguyên vẹn 100%.
* **Khi cập nhật phiên bản mới từ GitHub**: Tải code mới về, giữ nguyên file `propfin.db` của bạn là không bao giờ bị mất dữ liệu.

---

## ❓ CÂU HỎI THƯỜNG GẶP & XỬ LÝ SỰ CỐ (FAQ)

<details>
<summary><b>1. Bấm vào file Khoi_Dong_PropFin.bat nhưng cửa sổ đen hiện lên rồi tắt ngay?</b></summary>

* **Nguyên nhân**: Máy tính chưa có Python hoặc chưa thêm Python vào đường dẫn PATH.
* **Cách xử lý**: Hãy tải lại bản cài đặt từ [python.org](https://www.python.org/downloads/), khi cài nhớ **tích vào ô `Add python.exe to PATH`** ở dưới cùng. Sau đó bấm lại vào file khởi động.
</details>

<details>
<summary><b>2. Khi gõ lệnh python, Windows tự động mở Microsoft Store?</b></summary>

* **Nguyên nhân**: Đây là tính năng App Execution Aliases của Windows 10/11 khi chưa cài Python đầy đủ.
* **Cách xử lý**:
  1. Vào Windows Settings $\rightarrow$ Chọn **Apps** $\rightarrow$ Chọn **Advanced app settings** (hoặc gõ tìm *Manage app execution aliases* trên thanh tìm kiếm Start).
  2. Tìm 2 mục **"App Installer (python.exe)"** và **"App Installer (python3.exe)"** $\rightarrow$ Gạt sang **OFF**.
  3. Cài đặt Python từ [python.org](https://www.python.org/downloads/) với tùy chọn *Add python.exe to PATH*.
</details>

<details>
<summary><b>3. Làm thế nào để tắt ứng dụng khi không dùng nữa?</b></summary>

* Bạn chỉ cần đóng cửa sổ dòng lệnh đen (Command Prompt) có tiêu đề *"PropFin"* hoặc nhấn tổ hợp phím **`Ctrl + C`** trong cửa sổ đó.
</details>

<details>
<summary><b>4. Dữ liệu của tôi có được bảo mật không? Có bị gửi lên mạng không?</b></summary>

* **Hoàn toàn bảo mật 100%**: PropFin hoạt động theo mô hình Local-First (máy chủ chạy trực tiếp nội bộ trên máy tính của bạn thông qua SQLite). Toàn bộ số tài khoản ngân hàng, thông tin khách thuê và lịch sử thu chi được lưu cục bộ trên ổ cứng máy bạn, **không gửi bất kỳ dữ liệu nào ra máy chủ bên ngoài**.
</details>

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
PropFin/
├── 📄 Khoi_Dong_PropFin.bat      # Khởi động 1-click (tự cài thư viện & mở web)
├── 📄 Tao_Shortcut_Desktop.bat   # Tạo biểu tượng ứng dụng ra màn hình Desktop
├── 📄 PropFin.bat                # Khởi động nhanh
├── 📄 requirements.txt           # Danh sách thư viện Python cần thiết
├── 📄 run.py                     # Script khởi chạy máy chủ & tự mở trình duyệt
├── 📄 propfin.db                 # Cơ sở dữ liệu SQLite (chứa toàn bộ dữ liệu)
├── 📄 .gitignore                 # Cấu hình bỏ qua cache khi tải lên GitHub
├── 📁 backend/                   # Mã nguồn Backend (FastAPI, SQLite)
│   ├── app.py                   # FastAPI Application & Router
│   ├── database.py              # Schema cơ sở dữ liệu & migration
│   ├── models.py                # Pydantic Schemas
│   ├── seed_data.py             # Dữ liệu khởi tạo mẫu
│   └── routers/                 # Các API (properties, rooms, contracts, wallets...)
└── 📁 frontend/                  # Giao diện người dùng (HTML5, Vanilla CSS, JS)
    ├── index.html               # Trang Dashboard chính
    ├── css/                     # Thiết kế giao diện (style.css, components.css)
    └── js/                      # Các module JavaScript độc lập
```

---

<p align="center">
  <b>PropFin - Giải pháp tài chính & quản lý phòng trọ đơn giản, thông minh, hiệu quả!</b>
</p>
