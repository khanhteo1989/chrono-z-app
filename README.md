# Chrono-Z: Dự án Công nghệ Giáo dục Lịch sử V2.0 🚀

Chrono-Z là một nền tảng giáo dục số hoá mang tính đột phá, biến những trang sử khô khan thành các trải nghiệm tương tác trực quan, phong cách Gen-Z. 

## 🌟 Các tính năng nổi bật
1. **Dòng thời gian (Timeline Master):** Quản lý, theo dõi và chỉnh sửa các mốc sự kiện lịch sử của Việt Nam & Thế giới dưới dạng trực quan.
2. **Thẻ bài Nhân vật (Character Hub):** Tìm hiểu thông tin nhân vật lịch sử dưới dạng Thẻ bài (Trading Cards), hỗ trợ kéo thả ảnh và chỉnh sửa linh hoạt.
3. **Đấu trường Đố vui (Quiz Arena):** Hệ thống tự động sinh ra hàng nghìn bộ đề trắc nghiệm ngẫu nhiên từ dữ liệu lịch sử để kiểm tra kiến thức.
4. **Hỗ trợ Web Builder Mode:** Cho phép Admin trực tiếp chỉnh sửa (Thêm/Sửa/Xóa) dữ kiện lịch sử ngay trên giao diện web với mật khẩu bảo vệ ở môi trường Dev.

## 🛠 Hướng dẫn Cài đặt & Chạy Local

### Yêu cầu hệ thống:
- Node.js (v18 trở lên)

### Các bước chạy:
```bash
# 1. Cài đặt thư viện
npm install

# 2. Chạy môi trường Dev (Có quyền Admin chỉnh sửa dữ liệu)
npm run dev

# 3. Build ra sản phẩm tĩnh (Static Build)
npm run build
```

---

## 🚀 Hướng dẫn Đưa lên GitHub & Deploy (Dành cho Chủ dự án)

Để đưa dự án này lên mạng (Vercel, Netlify hoặc GitHub Pages), bạn làm theo các bước sau:

### Bước 1: Tạo kho lưu trữ trên GitHub
- Đăng nhập vào GitHub và tạo một **New Repository** (Tên tuỳ ý, ví dụ: `chrono-z`). Không tích chọn add README hay .gitignore nhé.

### Bước 2: Đẩy Code lên GitHub (Mở Terminal trong thư mục code)
```bash
git remote add origin https://github.com/TEN_CUA_BAN/chrono-z.git
git branch -M main
git push -u origin main
```
*(Thay link trên bằng link Repository bạn vừa tạo)*

### Bước 3: Deploy tự động
**Khuyên dùng Vercel (Dễ nhất):**
1. Vào trang [vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
2. Bấm **Add New -> Project**.
3. Chọn Repository `chrono-z` mà bạn vừa đẩy lên.
4. Framework Preset Vercel sẽ tự nhận diện là **Vite**. Bạn chỉ cần bấm **Deploy**.
5. Sau 1 phút, bạn sẽ có một đường link trang web trực tiếp! (Và những người dùng link này sẽ chỉ xem được nội dung, KHÔNG thể chỉnh sửa).

## 📄 License
Dự án được thiết kế độc quyền. Mọi quyền được bảo lưu.
