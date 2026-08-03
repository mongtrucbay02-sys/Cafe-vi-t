# ☕ Quản Lý Quán Cafe

Báo cáo cuối kỳ môn **Lập trình Web** — Trường Đại học CMC — Website quản lý quán cà phê (CRUD Menu, Đặt hàng, Thống kê).

**Giảng viên hướng dẫn:** Ngô Việt Anh
**Nhóm sinh viên:**
- Hoàng Minh Quân — BIT240194
- Nguyễn Tiến Trung — BIT240231
- Trần Trung Kiên — BIT240135

## 🌐 Demo & Tài liệu
- **Web trực tuyến:** https://mongtrucbay02-sys.github.io/Cafe-vi-t/
- **Video demo:** https://drive.google.com/file/d/1_KG3Bm-PzCXAwk5jBLLxe7tM1qjGx-DU/view?usp=drive_link
- **Báo cáo chi tiết:** [cafe-managenment.docx](./cafe-managenment.docx)

## 🚀 Công nghệ sử dụng
- HTML5, CSS3, JavaScript ES6+
- Bootstrap 5.3 (giao diện, modal, navbar responsive)
- Chart.js (biểu đồ thống kê, best sale)
- SweetAlert2 (xác nhận thao tác quan trọng)
- FontAwesome + Animate.css (icon, hiệu ứng)
- LocalStorage (lưu trữ toàn bộ dữ liệu, không cần backend)

## 👥 Phân công công việc

| Thành viên | Công việc | Sản phẩm |
|---|---|---|
| **Hoàng Minh Quân** | Thiết kế giao diện UI/UX: Home, About, Navbar, Footer, Responsive, Dark mode, hiệu ứng | `index.html`, `about.html`, `assets/css/style.css` |
| **Nguyễn Tiến Trung** | Quản lý Menu đồ uống (CRUD): thêm/sửa/xóa, tìm kiếm, lọc theo loại, sắp xếp theo giá, validation, LocalStorage | `menu.html`, `assets/js/menu.js`, `assets/js/menuService.js` |
| **Trần Trung Kiên** | Quản lý Đơn hàng & hoàn thiện hệ thống: giỏ hàng, tính tiền, thanh toán, Dashboard thống kê (Chart.js), Export/Import JSON, Login giả lập, ghép code | `order.html`, `dashboard.html`, `login.html`, `assets/js/order.js`, `assets/js/orderService.js`, `assets/js/dashboard.js`, `assets/js/auth.js`, `assets/js/app.js` |

## 📁 Cấu trúc thư mục
```
/index.html                  → Trang chủ                          (Hoàng Minh Quân)
/about.html                  → Giới thiệu                          (Hoàng Minh Quân)
/menu.html                   → Quản lý Menu đồ uống (CRUD)         (Nguyễn Tiến Trung)
/order.html                  → Đặt hàng / Giỏ hàng / Thanh toán    (Trần Trung Kiên)
/dashboard.html               → Dashboard thống kê + Best Sale      (Trần Trung Kiên)
/login.html                  → Đăng nhập giả lập                   (Trần Trung Kiên)

/assets/css/style.css         → Giao diện dùng chung + Dark mode    (Hoàng Minh Quân)

/assets/js/app.js             → Hàm dùng chung (dark mode, toast, navbar)
/assets/js/auth.js            → Đăng nhập giả lập + session LocalStorage
/assets/js/menuService.js      → Xử lý CRUD + LocalStorage cho Menu   (Nguyễn Tiến Trung)
/assets/js/menu.js            → Logic trang quản lý Menu             (Nguyễn Tiến Trung)
/assets/js/orderService.js     → Xử lý giỏ hàng, đơn hàng, thanh toán (Trần Trung Kiên)
/assets/js/order.js            → Logic trang Đặt hàng                (Trần Trung Kiên)
/assets/js/dashboard.js         → Logic biểu đồ thống kê              (Trần Trung Kiên)
```

## 🔑 Tài khoản đăng nhập demo
- Tên đăng nhập: `admin`
- Mật khẩu: `123456`

## ✅ Chức năng chính

### Hoàng Minh Quân — Giao diện
- Trang chủ + Giới thiệu, Navbar + Footer, Responsive (mobile/tablet/desktop)
- Dark mode / Light mode (lưu lựa chọn trong LocalStorage)
- Hiệu ứng chuyển động (Animate.css), thiết kế theo phong cách quán cà phê ấm áp

### Nguyễn Tiến Trung — Quản lý Menu (CRUD)
- Thêm / Sửa / Xóa món, đổi trạng thái Còn hàng ⇄ Hết hàng
- Tìm kiếm theo tên/mô tả, lọc theo danh mục & trạng thái, sắp xếp theo giá/bán chạy, phân trang
- Validation dữ liệu đầu vào realtime (tên, giá, tồn kho, mô tả tối thiểu 10 ký tự)
- Lưu dữ liệu LocalStorage, Export/Import JSON, Clear All (có confirm)

### Trần Trung Kiên — Đơn hàng & Hệ thống
- Tạo đơn hàng: chọn món từ menu còn hàng, thêm/xóa món trong giỏ, đổi số lượng
- Tự động tính tổng tiền, Thanh toán → trừ tồn kho + cộng số lượng đã bán vào Menu
- Lưu lịch sử đơn hàng bằng LocalStorage
- Dashboard thống kê: tổng sản phẩm, tổng đã bán, doanh thu, tổng đơn hàng
- Biểu đồ Best Sale (bar chart), tỉ lệ danh mục (doughnut), tồn kho (Chart.js)
- Đăng nhập giả lập (session LocalStorage), bảo vệ các trang Menu/Đặt hàng/Dashboard

## ▶️ Cách chạy
Mở trực tiếp file `index.html` bằng trình duyệt (Chrome/Edge/Firefox),
hoặc dùng Live Server / `python -m http.server` để tránh lỗi CORS khi import file JSON.

## 📝 Luồng demo đề xuất
1. Đăng nhập (`login.html`) với tài khoản `admin` / `123456`
2. Vào **Menu** thêm/sửa/xóa vài món, thử tìm kiếm & lọc
3. Vào **Đặt hàng**, chọn vài món, thanh toán thử một đơn
4. Vào **Dashboard** xem biểu đồ Best Sale cập nhật theo đơn vừa thanh toán
5. Bật thử **Dark mode**, thu nhỏ cửa sổ để kiểm tra Responsive
