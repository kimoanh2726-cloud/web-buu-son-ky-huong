# 🏮 BỬU SƠN KỲ HƯƠNG — ĐẠO TRÀNG CHÁNH ĐIỆN 50 CHỖ & KHẢO NGHIỆM GIÁO LÝ THỜI GIAN THỰC

> **Nền tảng tương tác thời gian thực (Real-time Multiplayer)** tái hiện không gian Chánh Điện tâm linh Bửu Sơn Kỳ Hương (Phật Thầy Tây An) với 50 chiếu cói cố định, đồng bộ hành vi đi lại - an vị - vấn đạo giáo lý giữa Máy Chủ (Host) và hàng chục người chơi (Player) đồng thời qua Internet (4G/5G/Wi-Fi).

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

## 🌐 HƯỚNG DẪN ĐẨY LÊN GITHUB & DEPLOY CLOUD MIỄN PHÍ SIÊU TỐC

### Bước 1: Đẩy Dự Án Lên GitHub
1. Mở trang [GitHub.com](https://github.com), tạo một Repository mới (ví dụ: `web-buu-son-ky-huong`).
2. Mở terminal tại thư mục dự án và chạy các lệnh sau:
```bash
git init
git add .
git commit -m "feat: Đạo tràng Chánh Điện 50 chỗ Bửu Sơn Kỳ Hương v1.0"
git branch -M main
git remote add origin https://github.com/<TÊN_GITHUB_CỦA_BẠN>/web-buu-son-ky-huong.git
git push -u origin main
```

### Bước 2: Triển Khai Cloud Siêu Tốc (Render.com) — Miễn Phí 100%
Để người chơi và máy chủ vào **cực nhanh, không độ trễ, không cần cắm máy tính tại nhà**:
1. Truy cập [Render.com](https://render.com), đăng nhập bằng tài khoản GitHub.
2. Nhấn nút **New +** ➔ Chọn **Web Service**.
3. Chọn kho mã nguồn `web-buu-son-ky-huong` bạn vừa đẩy lên.
4. Điền cấu hình cơ bản:
   * **Name:** `buu-son-ky-huong`
   * **Region:** `Singapore` (Chọn Singapore để người chơi ở Việt Nam có tốc độ nhanh nhất, ping <30ms!)
   * **Branch:** `main`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free`
5. Nhấn **Create Web Service**.
Sau khoảng 1-2 phút, bạn sẽ nhận được đường link cố định HTTPS (ví dụ: `https://buu-son-ky-huong.onrender.com`).
* Mọi người chơi ở bất kỳ đâu chỉ cần quét mã QR hoặc truy cập đường link trên là vào tức thì!

---

## 📜 BẢN QUYỀN & VĂN HÓA
Dự án được thực hiện với tinh thần bảo tồn và xiển dương giá trị đạo đức truyền thống **Tứ Đại Trọng Ân - Học Phật Tu Nhân** của tông phái **Bửu Sơn Kỳ Hương (Đức Phật Thầy Tây An Đoàn Minh Huyên, 1849)**.
