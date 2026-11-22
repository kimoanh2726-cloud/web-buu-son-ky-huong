# 🏮 BỬU SƠN KỲ HƯƠNG — ĐẠO TRÀNG CHÁNH ĐIỆN 50 CHỖ & KHẢO NGHIỆM GIÁO LÝ THỜI GIAN THỰC

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kimoanh2726-cloud/web-buu-son-ky-huong)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online%2024%2F7-brightgreen?style=for-the-badge&logo=render)](https://buu-son-ky-huong.onrender.com)
[![Host Controller](https://img.shields.io/badge/Host-M%C3%A1y%20Ch%E1%BB%A7%20Qu%E1%BA%A3n%20Tr%E1%BB%8B-gold?style=for-the-badge)](https://buu-son-ky-huong.onrender.com/?key=buusonkyhuong2026)

> **Nền tảng tương tác thời gian thực (Real-time Multiplayer)** tái hiện không gian Chánh Điện tâm linh Bửu Sơn Kỳ Hương (Phật Thầy Tây An) với 50 chiếu cói cố định, đồng bộ hành vi đi lại - an vị - vấn đạo giáo lý giữa Máy Chủ (Host) và hàng chục người chơi (Player) đồng thời qua Internet (4G/5G/Wi-Fi).

---

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT

1. **Không Gian Chánh Điện Trang Nghiêm (50 Chiếu Cói Cố Định):**
   - Bàn thờ Tam Bảo (Trần Điều vô vi, lư đồng, chân đèn, bình bông sen, đĩa trái cây, chuông bát).
   - 50 vị trí chiếu cói chia đều 2 cánh Tả - Hữu, giãn cách mỹ thuật chuẩn mực.
   - Cơ chế độc quyền: **Chiếu đã có người an vị sẽ tự khóa**, người khác không thể chiếm chỗ.

2. **Hành Vi Đi Lại & An Vị Linh Hoạt (Màn Hình Người Chơi):**
   - Sử dụng phím điều hướng D-Pad (▲, ◀, ▶, ▼) hoặc chạm trực tiếp lên màn hình cảm ứng để di chuyển avatar cư sĩ (Áo bà ba đen, khăn rằn Nam Bộ).
   - Nút nổi **"🙏 AN VỊ CHIẾU #..."** tự động hiện lên khi đến gần chiếu trống.
   - **Bắt buộc an vị mới được nhận đề:** Khi chuông reo, cư sĩ phải an vị vào chiếu mới mở được bảng câu hỏi; chưa an vị sẽ có cảnh báo giục giã an vị.

3. **Màn Hình Điều Khiển Máy Chủ Đa Năng (Host Controller):**
   - **Bảng câu hỏi lớn ở trung tâm:** Kích thước to, rõ ràng, dễ quan sát cho giảng đường/máy chiếu.
   - **Tắt/bật linh hoạt:** Nút `✕ Ẩn Bảng` và `❓ Bảng Câu Hỏi` cho phép ẩn bảng để chiêm bái toàn cảnh Chánh Điện.
   - **Điều hướng câu hỏi:** Nút `◀ Câu Trước` và `Câu Sau ➔` chuyển câu hỏi tự do.
   - **Chỉnh thời gian trực tiếp:** Các nút tăng/giảm thời gian (`+10s`, `+15s`, `-5s`) tác động tức thì lên toàn bộ máy người chơi.
   - **Mã QR & Xuất Poster A4 HD:** Trình chiếu mã QR phóng to hoặc tải poster A4 chất lượng cao để dán tại cửa đạo tràng.

4. **Kết Thúc & Vinh Danh Top 3:**
   - Khi hoàn tất 12 câu hỏi, vinh danh **Top 3 Cư Sĩ Công Đức Cao Nhất** (🥇 Quán Quân, 🥈 Á Quân, 🥉 Quý Quân) với vương miện và hào quang lộng lẫy trên sàn.
   - Cả máy chủ và người chơi **vẫn tự do đi lại trong Chánh Điện** sau khi game kết thúc.
   - Nút `🔄 Khởi Động Lại Từ Đầu` cho phép chủ tọa bắt đầu lượt khảo nghiệm mới bất cứ lúc nào.

---

## 🚀 TỐI ƯU HIỆU NĂNG & TỐC ĐỘ CAO (ULTRA-FAST SPEED)

Hệ thống đã được tích hợp sẵn các công nghệ tối ưu tốc độ vượt trội:
* **GZIP Compression:** Giảm 75-80% dung lượng HTML/CSS/JS tải về điện thoại người chơi.
* **Smart HTTP Caching:** Tự động lưu cache CSS, JS, Audio, Font trong 1 ngày; điện thoại người chơi truy cập tức thì trong vài mili-giây.
* **WebSocket Low-Latency:** Kết nối Socket.io trực tiếp hai chiều, tự động kết nối lại siêu tốc (500ms) nếu mạng 4G/5G chập chờn.
* **Favicon Chú Rùa:** Biểu tượng chú rùa tâm linh Bửu Sơn Kỳ Hương hiển thị đồng bộ trên mọi tab trình duyệt và màn hình chính.

---

## 🛠️ HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### Yêu Cầu Tiên Quyết
* Đã cài đặt [Node.js](https://nodejs.org/) (phiên bản 18 trở lên).
* Đã cài đặt [Git](https://git-scm.com/).

### Cài Đặt & Khởi Động Cục Bộ
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi động máy chủ
npm start
```
* **Màn hình Chủ Tọa (Host):** Mở trình duyệt vào `http://localhost:3000` (hoặc `http://localhost:3000/host.html?key=buusonkyhuong2026`).
* **Màn hình Người Chơi (Player):** Quét mã QR hiển thị trên màn hình host hoặc truy cập `http://<IP_MÁY_BẠN>:3000/player.html`.

---

## 📍 GHIM TỔNG HỢP ĐƯỜNG DẪN TRUY CẬP (PINNED LINKS)

Dành cho Ban Tổ Chức và Tín Đồ truy cập trực tiếp:

### 1. 🖥️ Xem trực tiếp trên máy tính của bạn (Nhanh nhất & Mới nhất 100%):
* 👑 **Web Máy Chủ (Chủ Tọa):** [http://localhost:3000/?key=buusonkyhuong2026](http://localhost:3000/?key=buusonkyhuong2026) *(hoặc [http://localhost:3000](http://localhost:3000))*
* 📱 **Web Người Chơi (Cư Sĩ):** [http://localhost:3000/player.html](http://localhost:3000/player.html)

### 2. 🌐 Xem trên điện thoại / Mạng 4G/5G (Đường truyền Tunnel trực tiếp):
* 👑 **Web Máy Chủ (Tunnel):** [https://f9471303d11913.app.lhr.life/?key=buusonkyhuong2026](https://f9471303d11913.app.lhr.life/?key=buusonkyhuong2026)
* 📱 **Web Người Chơi (Tunnel):** [https://f9471303d11913.app.lhr.life/player.html](https://f9471303d11913.app.lhr.life/player.html)

### 3. ☁️ Bản Cloud triển khai chính thức (Render Cloud 24/7):
* 👑 **Trang Máy Chủ Chủ Tọa:** [https://buu-son-ky-huong.onrender.com/?key=buusonkyhuong2026](https://buu-son-ky-huong.onrender.com/?key=buusonkyhuong2026)
* 📱 **Trang Người Chơi (Mobile/PC):** [https://buu-son-ky-huong.onrender.com/player.html](https://buu-son-ky-huong.onrender.com/player.html)
* 🔐 **Khóa Quản Trị Máy Chủ:** `buusonkyhuong2026`
* ☁️ **Hạ tầng máy chủ:** Render Cloud (Region Singapore) — Hoạt động trực tuyến 24/7

---

## 📜 BẢN QUYỀN & VĂN HÓA
Dự án được thực hiện với tinh thần bảo tồn và xiển dương giá trị đạo đức truyền thống **Tứ Đại Trọng Ân - Học Phật Tu Nhân** của tông phái **Bửu Sơn Kỳ Hương (Đức Phật Thầy Tây An Đoàn Minh Huyên, 1849)**.
