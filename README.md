# HISTORLOG-Z — History and Technology (bản nâng cấp Admin CMS + bảo mật)

Nền tảng học Lịch sử tương tác cho học sinh THPT (dự án KHKT): Dòng thời gian
Việt Nam & Thế giới × 4 thời kỳ, Bản đồ lịch sử tương tác, Thẻ nhân vật có thử
thách mở khóa, Chrono-Quiz **chấm điểm server-side**, và **Admin CMS 15 màn hình**
chỉnh sửa toàn bộ nội dung không cần code.

- Site live: https://chrono-z-app.vercel.app/
- Stack: React 19 + Vite 8 + Tailwind 3 + Supabase (Auth · Postgres · RLS · Storage)

## Tính năng chính

| Khu | Nội dung |
|---|---|
| Trang chủ | phong cách bảo tàng (trắng–burgundy–đen–vàng đồng), khung hình bình hành, banner thông báo, form góp ý — **sửa được qua CMS** |
| Dòng thời gian | Việt Nam/Thế giới × Cổ đại→Hiện đại, tìm **không phân biệt dấu**, lọc khoảng năm, đủ 4 khía cạnh (nguyên nhân/diễn biến/kết quả/ý nghĩa), nguồn, prev/next, **so sánh song song VN↔ Thế giới**, link chéo Map/Character/Quiz |
| Bản đồ | 4 bản đồ yêu cầu (Âu 1914 · Á 1945 · VN 1945 · Phi 1960) + Map Studio: upload nền, **click đặt ghim, kéo ghim**, gắn sự kiện, zoom/pan cảm ứng |
| Thẻ nhân vật | Basic/Rare/Epic/Legend, thử thách **đúng toàn bộ** 7/9/11/12 câu (Epic/Legend giới hạn 15′), **không hiện đáp án khi làm**, trạng thái mở khóa lưu server — Admin sửa thẻ không mất unlock của học sinh |
| Chrono-Quiz | chủ đề 15 câu · tổng hợp 20 câu/15′ tự nộp, trộn câu + trộn đáp án, cảnh báo câu trống, lịch sử — **điểm do RPC `submit_quiz` cấp, học sinh không tự khai được** |
| Tài khoản | điểm tích lũy (server ledger, trần 150/ngày), mốc huy hiệu 30/50/100/200/300, bộ sưu tập thẻ, lịch sử làm bài |
| Admin CMS | 15 màn hình: Dashboard, bootstrap admin, trang chủ, timeline, Map Studio, Character Studio, câu hỏi + **import CSV**, Media Library (nguồn/tác giả/giấy phép), tài khoản & role, điểm, thông báo, góp ý, **dashboard nghiên cứu KHKT** (pre/post, nhóm TN/ĐC, t-test, xuất CSV), audit log, **backup & khôi phục phiên bản** |

## Bảo mật (điểm chính)

- Không mật khẩu admin chung; role chỉ do **Supabase Auth + RLS** quyết định.
- User **không tự đổi role, không tự cộng điểm** (không có policy UPDATE trên
  `profiles`; mọi ghi qua SECURITY DEFINER RPC, có log).
- `bootstrap_admin()` chỉ cấp được khi hệ thống **chưa có admin nào**.
- Đáp án quiz không rời server trước khi nộp; trigger chặn hạ admin cuối cùng.
- Không service_role key trong frontend. Chỉ dùng publishable key (public — an
  toàn vì RLS), khai báo trong **Environment Variables** của Vercel.

## Chạy local

```bash
npm install
cp .env.example .env   # điền VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
npm run build          # production build
```

SQL: chạy `supabase/001_historlogz.sql` rồi `supabase/002_security_and_grading.sql`
trong Supabase SQL Editor (idempotent). Hướng dẫn đầy đủ + giới hạn trung thực:
**`docs/CAI_DAT_VA_GIOI_HAN.md`**. Quy trình tạo admin đầu tiên: cùng file, mục 4.

## Đẩy lên GitHub → Vercel tự deploy

Repo GitHub đã nối project Vercel `chrono-z-app` — chỉ cần push, Vercel build lại tự động:

```bash
git init -b main
git add -A
git commit -m "nang cap: admin CMS + bao mat Supabase + cham diem server-side"
git remote add origin https://github.com/<TAI-KHOAN>/<REPO-CUA-VERCEL>.git
git push -u origin main
```

Sau khi deploy: vào Vercel → Project `chrono-z-app` → Settings → Environment
Variables → thêm `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Production &
Preview) → Redeploy. `vercel.json` đã có rewrite SPA để `/admin` không 404.

## Cấu trúc

```
src/
  supabase.js      # client env-first (VITE_SUPABASE_*)
  auth.jsx         # AuthProvider — role đọc từ profiles (server)
  store.jsx        # DataProvider — merge CMS + legacy, 1 nguồn duy nhất
  cms.js           # CRUD content_items + RPC quiz + import legacy (resilient)
  utils.js         # bỏ dấu VN, điểm mốc, thống kê, CSV
  mapSamples.js    # 4 bản đồ yêu cầu (có thể import vào CMS)
  components/      # Home, Timeline, Map, Character, Quiz, Account, Admin, About
supabase/
  001_historlogz.sql            # schema nền + bucket
  002_security_and_grading.sql  # bảo mật + RPC chấm điểm + ledger + revisions
docs/
  CAI_DAT_VA_GIOI_HAN.md   # cài đặt, admin đầu tiên, giới hạn trung thực
  DOI_CHIEU_YEU_CAU.md     # đối chiếu từng yêu cầu MASTER PROMPT
```

## License
Dự án nghiên cứu KHKT độc quyền — mọi quyền được bảo lưu.
