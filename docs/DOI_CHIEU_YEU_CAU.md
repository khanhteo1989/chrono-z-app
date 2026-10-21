# Bảng đối chiếu yêu cầu / mức triển khai thực tế (bản nâng cấp 2026-10)

Nguồn yêu cầu: MASTER PROMPT HISTORLOG-Z. Cột "Kiểm chứng" ghi theo mức ĐÃ THẬT:
🟢 = đã build PASS / code review xong · 🟡 = code xong, **chưa chạy trên Supabase production**
(chưa xác minh bằng RPC thật) · 🔵 = một phần / cần dữ liệu người dùng thật.

| Yêu cầu | Triển khai | Kiểm chứng |
|---|---|---|
| Audit đầu vào | Báo cáo audit 3 mức (đủ/thiếu/lỗi bảo mật) đã trình bày, dẫn file cụ thể | 🟢 |
| Admin CMS 15 màn hình tại /admin | `AdminCMS.jsx`: Dashboard, bootstrap, trang chủ, timeline, Map Studio, Character Studio, câu hỏi+CSV, media, thông báo, tài khoản, điểm, góp ý, nghiên cứu, audit, backup | 🟡 (build pass, chưa bấm thử trên DB live) |
| Role User/Admin qua Supabase Auth + RLS | policy `profiles` không cho client UPDATE; đổi role chỉ qua RPC `set_user_role` (admin) + log; `protect_last_admin` | 🟡 (cần chạy 002) |
| Không mật khẩu admin cứng ở frontend | Đã xóa `admin123` trong About.jsx (lỗi bản cũ); sửa About chỉ khi isAdmin | 🟢 |
| Không check email làm admin ở frontend | Không còn chỗ nào; role đọc từ `profiles.role` | 🟢 |
| User không tự sửa role/điểm | RLS chặn update; điểm chỉ qua `award_points` ledger (trần 150/ngày, chống trùng) | 🟡 |
| Không service_role key trong browser | `src/supabase.js` chỉ dùng URL + publishable key từ env | 🟢 |
| Quy trình tạo admin đầu tiên an toàn | 2 cách (SQL / RPC `bootstrap_admin` one-time), hướng dẫn trong docs §4 | 🟡 |
| Nhật ký thao tác Admin | trigger `log_content_change` + ghi tay trong RPC; màn hình Audit log | 🟡 |
| Trang chủ bảo tàng, CMS sửa được | `Home.jsx` + màn "Trang chủ" CMS (hero/intro/guide/banner); palette trắng–burgundy–đen–vàng đồng, khung bình hành, Arial + Times New Roman | 🟡 |
| Timeline VN/Thế giới × 4 thời kỳ, tìm không dấu, lọc năm | `TimelineMaster.jsx` + `utils.normVN`, year-range, prev/next theo thứ tự năm | 🟢 |
| 4 khía cạnh + nguồn + link chéo | nguyên nhân/diễn biến/kết quả/ý nghĩa, nguồn, link Map/Character/Quiz bằng key ổn định `ev-N` | 🟢 |
| So sánh song song VN↔Thế giới | chế độ "parallel" 2 cột | 🟢 |
| Không hardcode danh sách nguồn một chỗ | nguồn nằm trong payload CMS từng sự kiện | 🟢 |
| 4 bản đồ yêu cầu + zoom/pan + hotspot | `MapExplorer.jsx` + `mapSamples.js` (Âu 1914, Á 1945, VN 1945, Phi 1960); kéo/zoom wheel/nút | 🟢 (chưa đo trên điện thoại thật) |
| Map Studio no-code | upload nền, click đặt ghim, kéo ghim, gắn sự kiện, publish/ẩn | 🟡 |
| Thẻ 4 cấp + thử thách đúng toàn bộ | `CharacterHub` + RPC `start_quiz('unlock')`/`submit_quiz`; Epic/Legend 15′; không hiện đáp án khi làm | 🟡 |
| Unlock lưu server, sửa thẻ không mất unlock | bảng `character_unlocks` FK uuid; import không đụng unlock | 🟡 |
| Câu hỏi từ dữ liệu kiểm duyệt, không AI | RPC chỉ lấy `content_items` published; câu `generateDynamicQuizzes` cũ bị loại khỏi đề thức | 🟢 |
| Quiz chủ đề 15 / tổng hợp 20×15′ tự nộp | `QuizArena.jsx` | 🟡 |
| Chấm điểm server-side, không nhận điểm user khai | `submit_quiz` duy nhất ghi điểm; client insert `quiz_attempts` bị khóa policy | 🟡 |
| CSV/Excel import câu hỏi cho admin | parser CSV `;`/`,` + tải file mẫu | 🟡 |
| Điểm mốc 30/50/100/200/300 + badge server | POINT_TIERS + ledger + tierFor | 🟡 |
| Media Library: nguồn/tác giả/giấy phép/chú thích | bucket + `content_items kind=media` | 🟡 |
| Dashboard nghiên cứu: pre/post, TN/ĐC, mã HS, biểu đồ, CSV, thống kê | `Research` màn CMS + `research_sessions` (consent, anonymous code, admin-only RLS) + pairedTTest/Cohen's d từ số liệu THẬT | 🟡 (cần số liệu thật; KHÔNG kết luận cải thiện khi chưa có) |
| Vận hành dài hạn không code (thêm 100 sự kiện, bản đồ 5, 50 thẻ, 20 quiz, sửa đáp án, ẩn bản nháp, khôi phục sửa nhầm, xuất kết quả) | đủ 10 thao tác acceptance trong CMS; revisions 20 bản/mục | 🟡 |
| Build production sạch | `npx vite build` PASS (620 kB, cảnh báo chunk size — chấp nhận được) | 🟢 |
| Responsive | CSS breakpoint 980/760px, burger menu | 🔵 (chưa đo thiết bị thật) |
| Vercel deploy không hỏi secret | `vercel.json` rewrite SPA + docs biến môi trường | 🟢 (file), deploy thật cần push |

**Việc còn tồn (không đánh dấu hoàn thành):**
1. Chạy 2 file SQL trên project Supabase production + `Import` dữ liệu cũ từ Dashboard.
2. Test E2E các luồng: bootstrap admin → import → quiz có điểm → unlock thẻ → nghiên cứu CSV.
3. Ảnh bản đồ nền & ảnh tư liệu public-domain có ghi nguồn (bucket trống).
4. 3 dòng rác trong `scannedData.js` (id 1, 20, 21) — nên ẩn/xóa qua CMS sau khi import.
5. Kiểm tra trên điện thoại/iPad thật.
6. Logo đồ họa chuẩn + favicon brand.
