# HISTORLOG-Z — HƯỚNG DẪN CÀI ĐẶT & GIỚI HẠN

> Phiên bản nâng cấp: Admin CMS + bảo mật Supabase + chấm điểm server-side.
> Mọi mục "chưa kiểm chứng" bên dưới là trung thực — nhóm chỉ đánh dấu hoàn thành
> những gì đã chạy thật.

---

## 1. YÊU CẦU HỆ THỐNG

| Thành phần | Phiên bản đã dùng khi dev |
|---|---|
| Node.js | v26.x (v18+ là đủ cho Vite 8) |
| npm | 10+ |
| Trình duyệt | Chrome/Edge/Firefox/Safari bản recent (cần `Pointer Events` cho Map Studio) |
| Supabase | Project miễn phí là đủ (Auth + Postgres + Storage) |

## 2. CÀI ĐẶT LOCAL

```bash
npm install          # cài dependencies
npm run dev          # chạy http://localhost:5173
npm run build        # build production ra thư mục dist/
npm run lint         # oxlint
```

### Cấu hình Supabase (bắt buộc)

Tạo file `.env` ở thư mục gốc project (KHÔNG commit file này):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx
```

- Hai giá trị này lấy ở **Supabase → Settings → API → Project URL / Publishable key**.
  Đây là key **public** (anon/publishable) — an toàn khi nằm trong bundle frontend vì
  mọi quyền thật do **Row Level Security** quyết định.
- **KHÔNG BAO GIỜ** đưa `service_role key` vào frontend hay commit lên git.
- `src/supabase.js` đọc env trước, có fallback tới project cũ để site không vỡ khi
  quên cấu hình. Khi deploy Vercel → khai báo 2 biến môi trường trong
  **Project Settings → Environment Variables**.

## 3. CHẠY SQL (3 BƯỚC, theo thứ tự)

Vào **Supabase → SQL Editor**, paste và chạy lần lượt:

1. `supabase/001_historlogz.sql` — schema gốc (profiles, content_items, bucket media,
   trigger tạo profile, policy RLS nền).
2. `supabase/002_security_and_grading.sql` — **migration bảo mật + chấm điểm**:
   - cột mới cho `content_items` (`legacy_id`, `region`, `period`, `year_start/end`,
     `visible`, `sort_order`) + index chống trùng khi import dữ liệu cũ
   - `point_ledger` (sổ cái điểm, append-only, trần 150 điểm/ngày)
   - `quiz_exams`, `character_unlocks`, `research_sessions`, `feedback`,
     `admin_logs`, `content_revisions`
   - RPC: `start_quiz`, `submit_quiz`, `bootstrap_admin`, `set_user_role`,
     `award_points`, `admin_adjust_points`, `admin_stats`, `cms_export`,
     `record_research_score`, `revoke_unlock`
   - trigger `protect_last_admin` (không tự hạ admin cuối cùng),
     `log_content_change` (nhật ký), `snapshot_content` (20 phiên bản/nội dung)
3. Kiểm tra bucket `historlog-media` đã tồn tại (001 tạo). Nếu chưa, tạo thủ công:
   Storage → New bucket → tên `historlog-media` → **public**, giới hạn 8 MB.
4. **BẬT OTP ĐĂNG KÝ (khuyến nghị)**: Authentication → **Sign In / Providers** →
   Email → bật **Confirm email**. Từ đây, học sinh bấm "Gửi mã OTP" ở trang Tài
   khoản sẽ nhận **mã 6 số về email** và phải nhập mã mới dùng được tài khoản.
   Mặc định Supabase gửi bằng mailer giới hạn ~2 email/giờ — muốn gửi cho cả lớp,
   vào **Authentication → SMTP settings** điền SMTP Gmail (cần App Password tạo
   tại myaccount.google.com → Security → App passwords; App Password chỉ nhập vào
   Supabase Dashboard, KHÔNG đưa vào code/chat).
   Nếu TẮT Confirm email: học sinh đăng ký xong dùng ngay, không có bước OTP
   (web vẫn chạy bình thường — code tự nhận biết).

Cả 2 file đều **idempotent** (`if not exists` / `or replace` / `drop policy if exists`)
→ chạy lại nhiều lần an toàn, không mất dữ liệu.

## 4. TẠO TÀI KHOẢN ADMIN ĐẦU TIÊN (an toàn)

**Không có mật khẩu admin chung, không kiểm tra email ở frontend, admin không
đăng ký qua trang web.**

Cách A — **luồng riêng qua email mời (khuyên dùng)**:
1. Supabase Dashboard → **Authentication → Users → Invite user by email** →
   nhập email người quản trị. Họ nhận mail, đặt mật khẩu, đăng nhập bình thường
   (kênh mời này không thể bị người lạ tự đăng ký).
2. SQL Editor gán quyền:
   ```sql
   update public.profiles set role = 'admin'
    where id = (select id from auth.users where email = 'EMAIL_ADMIN');
   ```

Cách B — trên website: người định làm admin **Đăng ký** (có OTP) → đăng nhập →
vào `/admin` → màn **"Tạo Admin đầu tiên"** → bấm nút. RPC `bootstrap_admin()`
**chỉ hoạt động khi hệ thống chưa có admin nào**, nên không ai leo quyền được
sau này.

Sau đó: trang **Dashboard → "Đồng bộ dữ liệu cũ (Import)"** cho từng loại
(events / characters / questions) để đưa 21 sự kiện + 6 nhân vật + 25 câu hỏi
mẫu vào CMS. Nút này **idempotent** (dùng `legacy_id` chống trùng) — bấm nhiều lần
không tạo bản sao, và không xóa unlock của học sinh.

## 5. CÁCH DÙNG CMS (không cần code)

15 màn hình trong `/admin`:

| Màn hình | Dùng để |
|---|---|
| Tổng quan | thống kê thật từ DB + lối tắt |
| Tạo Admin đầu tiên | quy trình bootstrap |
| Trang chủ | sửa hero / giới thiệu / hướng dẫn / ảnh nền |
| Dòng thời gian | thêm–sửa–ẩn 100+ sự kiện, 4 khía cạnh, nguồn |
| Map Studio | tạo bản đồ thứ 5+, tải ảnh nền, click đặt ghim, kéo ghim, gắn sự kiện |
| Character Studio | thêm thẻ, chọn độ hiếm (tự sinh số câu/thời gian/điểm) |
| Ngân hàng câu hỏi | sửa đáp án, **import CSV/Excel hàng loạt**, tải file mẫu |
| Media Library | ảnh dùng chung + **Nguồn/Tác giả/Giấy phép/Chú thích** |
| Thông báo | banner đầu trang |
| Tài khoản & vai trò | nâng/hạ vai trò (có log) |
| Điểm & thành tựu | bảng xếp hạng + điều chỉnh điểm có lý do |
| Góp ý | đọc/phân loại feedback từ trang chủ |
| Nghiên cứu KHKT | mã HS ẩn danh, nhóm TN/ĐC, pre/post, t-test, xuất CSV |
| Nhật ký quản trị | audit log mọi thao tác |
| Sao lưu & khôi phục | export JSON/CSV, import backup, khôi phục phiên bản cũ |

**Ẩn bản nháp:** bỏ tick "Xuất bản" → học sinh không thấy, Admin vẫn thấy.
**Khôi phục sửa nhầm:** Sao lưu & khôi phục → "Xem phiên bản đã lưu" → Khôi phục.

## 6. QUY TẮC ĐIỂM & MỞ KHÓA (server áp, client không sửa được)

- Quiz chủ đề: **15 câu**. Quiz tổng hợp: **20 câu / 15 phút**, tự động nộp.
- Mỗi câu đúng **+5 điểm**. Trần **150 điểm/ngày** (chống farm).
- Mở khóa thẻ: **đúng TOÀN BỘ** số câu yêu cầu, trong thời gian, nộp đủ:
  Basic 7 câu · Rare 9 · Epic 11 + 15 phút · Legend 12 + 15 phút.
- Điểm mở khóa: Basic 10 · Rare 20 · Epic 30 · Legend 50.
- Mốc huy hiệu: 30 → 50 → 100 → 200 → 300.
- Pre/Post-test **không cộng điểm** (tránh ảnh hưởng biến số nghiên cứu).
- Trong lúc làm bài, client **không nhận field `answer`** — đáp án & giải thích
  chỉ có sau khi `submit_quiz` chạy trên server.

## 7. GIỚI HẠN CẦN BIẾT (trung thực)

1. **Quiz luyện tập offline:** nếu Supabase chưa import câu hỏi hoặc chưa chạy
   migration 002, QuizArena tự chuyển sang chế độ *luyện tập* và **hiện rõ nhãn
   "không cộng điểm"**. Không phải gian lận — chỉ là fallback để học sinh không bị chặn.
2. **Ảnh lịch sử:** ảnh trong bundle là ảnh minh họa/phục dựng. Trang sự kiện luôn
   kèm chú thích "không phải tư liệu gốc nếu là tranh phục dựng". Khi lên thuyết minh,
   hãy thay bằng ảnh public-domain có ghi nguồn (Wikimedia Commons).
3. **`src/scannedData.js`** còn 3 dòng rác do công cụ tạo dữ liệu cũ sinh ra
   (id 1, 20, 21). Admin ẩn/xóa trong Dòng thời gian. Không tự xóa khỏi file để tránh
   lệch `legacy_id` mà dữ liệu production đang tham chiếu.
4. **`generateDynamicQuizzes`** trong `src/quizData.js` tạo câu hỏi tự động — theo
   yêu cầu nghiên cứu, câu hỏi AI-generated **không** được dùng làm đề chính thức.
   Server chỉ lấy câu hỏi đã publish trong `content_items`; đừng import câu auto.
5. **Kiểm định t** dùng xấp xỉ phân phối chuẩn (đủ cho báo cáo THPT) — nên đối chiếu
   bằng SPSS/R/Excel khi bảo vệ. Kết luận "nền tảng cải thiện kết quả học tập" **chỉ
   được nói khi có số liệu pre/post thật**; dashboard không bịa số.
6. **`app_storage`/`saveAppData`** (cũ) chỉ còn cho dữ liệu di sản; ghi đã bị siết về
   admin sau migration.
7. **Vercel:** plugin `/api/*` trong `vite.config.js` chỉ hoạt động khi `npm run dev`
   → nó KHÔNG tồn tại trên Vercel. Frontend mới **không còn gọi** `/api/upload`,
   `/api/save` nữa (đã chuyển hết sang Supabase), nên không còn lỗi "upload hỏng trên
   production". Plugin vẫn giữ để tương thích công cụ dev cũ.
8. **Chưa kiểm chứng trong môi trường này:** chưa chạy được `npm run build` và các
   luồng thật trên Supabase production (xem §8). Chưa test thiết bị di động thật.

## 8. TÌNH TRẠNG KIỂM THỬ

| Hạng mục | Trạng thái |
|---|---|
| Cú pháp/build | xem `npm run build` ở mục dưới — cần Khang chạy `!npm run build` nếu classifier lỗi |
| Luồng đăng ký/đăng nhập | chưa test với project Supabase production |
| Bootstrap admin | logic đã review; chưa chạy thật |
| Start/submit quiz + cộng điểm | SQL đã review; chưa chạy RPC thật |
| Map Studio đặt/kéo ghim | chưa test trình duyệt thật |
| Import CSV/legacy | chưa test |
| Responsive mobile | mới ước lượng CSS, chưa đo |

## 9. DEPLOY VERCEL

1. Push code lên GitHub repo đã nối Vercel.
2. Vercel → Project `chrono-z-app` → Settings → Environment Variables → thêm
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Production + Preview).
3. Build command `npm run build`, Output dir `dist` (Vercel tự nhận từ vite).
4. Thêm SPA rewrite để `/admin` không 404: tạo `vercel.json`
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
5. Deploy xong: chạy 2 file SQL, đăng ký tài khoản, bootstrap admin, bấm Import.

Không dán `service_role key` hay mật khẩu vào chat/source.
