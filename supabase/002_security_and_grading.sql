-- ============================================================================
-- HISTORLOG-Z — Migration 002: BẢO MẬT + CHẤM ĐIỂM SERVER-SIDE + ĐIỂM/THẺ
-- Chạy trong Supabase SQL Editor (quyền owner). An toàn khi chạy lại (idempotent).
-- Không chứa bất kỳ mật khẩu / service-role key / email admin mẫu nào.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. helper: hiện có admin chưa (dùng cho quy trình tạo admin đầu tiên)
-- ---------------------------------------------------------------------------
create or replace function public.admin_exists() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where role = 'admin') $$;

-- ---------------------------------------------------------------------------
-- 1. PROFILES: thêm điểm, tên hiển thị; chặn user tự sửa
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists points integer not null default 0
  check (points >= 0);
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

drop policy if exists profile_read_own on public.profiles;
create policy profile_read_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- User chỉ được tạo profile của chính mình (thường do trigger create_profile)
drop policy if exists profile_insert_own on public.profiles;
create policy profile_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid() and role = 'user');

-- Không có policy UPDATE/DELETE cho client => mọi thay đổi role/points phải đi
-- qua SECURITY DEFINER function phía server. User KHÔNG tự đổi role được.
drop policy if exists profile_admin_write on public.profiles;
create policy profile_admin_write on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admin không được tự hạ/xóa chính mình khỏi quyền admin (tránh khóa cửa)
create or replace function public.protect_last_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE' or new.role <> 'admin') and old.role = 'admin'
     and (select count(*) from public.profiles where role = 'admin') = 1 then
    raise exception 'Không thể hạ cấp admin cuối cùng.';
  end if;
  if tg_op = 'UPDATE' then new.updated_at = now(); end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

drop trigger if exists profiles_protect_last_admin on public.profiles;
create trigger profiles_protect_last_admin
  before update or delete on public.profiles
  for each row execute function public.protect_last_admin();

-- ---------------------------------------------------------------------------
-- 2. QUY TRÌNH AN TOÀN TẠO ADMIN ĐẦU TIÊN
--    Cách A (khuyên dùng): đăng nhập bằng email dự kiến trên website, rồi chạy
--      update public.profiles set role='admin'
--       where id = (select id from auth.users where email = 'EMAIL_CUA_BAN');
--    Cách B: gọi RPC bootstrap_admin() từ chính phiên đăng nhập đó (chỉ hoạt
--      động khi hệ thống CHƯA có admin nào => không thể leo quyền lần 2).
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_admin() returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Phải đăng nhập (authenticated) để chạy bootstrap_admin().';
  end if;
  if public.admin_exists() then
    raise exception 'Đã tồn tại tài khoản admin. Không tự cấp quyền qua RPC này.';
  end if;
  update public.profiles set role = 'admin' where id = uid;
  return 'Đã cấp quyền admin cho tài khoản đang đăng nhập.';
end $$;

revoke all on function public.bootstrap_admin() from public;
grant execute on function public.bootstrap_admin() to authenticated;

-- Admin đổi vai trò khác (chỉ admin, không dùng để tự cấp cho mình)
create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Không có quyền quản trị.'; end if;
  if p_role not in ('user','admin','editor') then raise exception 'Vai trò không hợp lệ.'; end if;
  update public.profiles set role = p_role where id = p_user_id;
  insert into public.admin_logs(actor_id, action, target, detail)
    values (auth.uid(), 'set_user_role', p_user_id::text, p_role);
end $$;

-- ---------------------------------------------------------------------------
-- 3. SỔ NHẬT KÝ ĐIỂM (ledger) — chống cộng điểm tùy ý từ client
-- ---------------------------------------------------------------------------
create table if not exists public.point_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  amount integer not null,
  ref_id text,
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref_id)
);
alter table public.point_ledger enable row level security;
drop policy if exists point_ledger_own_read on public.point_ledger;
create policy point_ledger_own_read on public.point_ledger
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
-- Không có policy insert/update/delete: client không tự ghi điểm. Chỉ RPC định nghĩa
-- SECURITY DEFINER được ghi.

create or replace function public.award_points(
  p_user_id uuid, p_reason text, p_amount integer, p_ref_id text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare remaining integer; granted integer;
begin
  if p_amount <= 0 then return 0; end if;
  -- Trần điểm theo ngày (chống cày điểm tự động). Mặc định 150 điểm/ngày.
  select greatest(150 - coalesce(sum(amount),0), 0) into remaining
    from public.point_ledger
    where user_id = p_user_id and created_at > now() - interval '1 day';
  if remaining <= 0 then return 0; end if;
  granted := least(p_amount, remaining);
  insert into public.point_ledger(user_id, reason, amount, ref_id)
    values (p_user_id, p_reason, granted, p_ref_id)
    on conflict (user_id, reason, ref_id) do nothing
    returning amount into granted;
  if granted is null then return 0; end if;
  update public.profiles set points = points + granted where id = p_user_id;
  return granted;
end $$;

-- ---------------------------------------------------------------------------
-- 4. NGÂN HÀNG CÂU HỎI: payload chuẩn hoá + cột truy vấn nhanh
-- ---------------------------------------------------------------------------
-- questions đã bị ẩn khỏi policy select public trong 001 => đáp án không lộ ra client.
alter table public.content_items
  add column if not exists region text,
  add column if not exists period text,
  add column if not exists year_start integer,
  add column if not exists year_end integer,
  add column if not exists sort_order integer not null default 0,
  add column if not exists visible boolean not null default true,
  add column if not exists legacy_id text;

create index if not exists content_items_lookup_idx
  on public.content_items(kind, region, period, published);
create unique index if not exists content_items_legacy_idx
  on public.content_items(kind, legacy_id) where legacy_id is not null;

comment on column public.content_items.legacy_id is
  'ID dữ liệu kế thừa (scannedData/data.js) — dùng làm khoá hợp nhất CMS, không trùng khi Admin sửa.';

-- ---------------------------------------------------------------------------
-- 5. KỲ THI / CHẤM ĐIỂM SERVER-SIDE
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('topic','general','unlock','pretest','posttest')),
  topic text,
  character_id uuid references public.content_items(id) on delete set null,
  research_session_id uuid,
  question_ids uuid[] not null default '{}',
  minute_limit integer,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  submitted_at timestamptz,
  score integer,
  total integer,
  answers jsonb
);
alter table public.quiz_exams enable row level security;
drop policy if exists exams_own_read on public.quiz_exams;
create policy exams_own_read on public.quiz_exams
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
-- Chỉ RPC nghiệp vụ được tạo/nộp kỳ thi; client không insert trực tiếp.

-- ---------------------------------------------------------------------------
-- 6. MỞ KHÓA THẺ NHÂN VẬT (lưu server-side, Admin sửa thẻ không mất trạng thái)
-- ---------------------------------------------------------------------------
create table if not exists public.character_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.content_items(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, character_id)
);
alter table public.character_unlocks enable row level security;
drop policy if exists unlocks_own_read on public.character_unlocks;
create policy unlocks_own_read on public.character_unlocks
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. RESEARCH (KHKT): phiên tham gia + đồng thuận + pre/post test
-- ---------------------------------------------------------------------------
create table if not exists public.research_sessions (
  id uuid primary key default gen_random_uuid(),
  student_code text not null unique,      -- mã số học sinh, KHÔNG lưu tên thật
  user_id uuid references auth.users(id) on delete set null, -- tài khoản học sinh (tùy chọn, để auto-ghi pre/post test)
  group_name text not null check (group_name in ('thuc_nghiem','doi_chung')),
  phase text not null default 'pre' check (phase in ('pre','post','done')),
  consent boolean not null default false, -- sự đồng ý tham gia
  pre_score numeric,
  post_score numeric,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.research_sessions enable row level security;
drop policy if exists research_admin_all on public.research_sessions;
create policy research_admin_all on public.research_sessions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Người học thường không truy cập bảng này (đảm bảo kín thông tin nghiên cứu).

-- ---------------------------------------------------------------------------
-- 8. GÓP Ý (form trang chủ) — user chỉ insert, admin chỉ xem
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text, email text, message text not null,
  status text not null default 'new' check (status in ('new','read','resolved')),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback
  for insert to anon, authenticated with check (char_length(message) between 2 and 4000);
drop policy if exists feedback_admin_read on public.feedback;
create policy feedback_admin_read on public.feedback
  for select to authenticated using (public.is_admin());
drop policy if exists feedback_admin_update on public.feedback;
create policy feedback_admin_update on public.feedback
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 9. NHẬT KÝ QUẢN TRỊ
-- ---------------------------------------------------------------------------
create table if not exists public.admin_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  detail text,
  created_at timestamptz not null default now()
);
alter table public.admin_logs enable row level security;
drop policy if exists logs_admin_read on public.admin_logs;
create policy logs_admin_read on public.admin_logs
  for select to authenticated using (public.is_admin());
-- Policy INSERT dự phòng cho các trigger/RPC (SECURITY DEFINER do owner chạy nên
-- thường đã vượt RLS; giữ policy này để an toàn nếu ownership thay đổi).
drop policy if exists logs_insert on public.admin_logs;
create policy logs_insert on public.admin_logs
  for insert to authenticated with check (actor_id = auth.uid() or actor_id is null);
-- Trigger ghi log mọi thay đổi content_items:
create or replace function public.log_content_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    insert into public.admin_logs(actor_id, action, target, detail)
    values (auth.uid(), 'content_'||lower(tg_op), coalesce(new.id, old.id)::text,
            coalesce(new.kind, old.kind)||': '||coalesce(new.title, old.title));
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists content_items_audit on public.content_items;
create trigger content_items_audit
  after insert or update or delete on public.content_items
  for each row execute function public.log_content_change();

-- ---------------------------------------------------------------------------
-- 10. LỊCH SỬ PHIÊN BẢN NỘI DUNG (khôi phục bản trước)
-- ---------------------------------------------------------------------------
create table if not exists public.content_revisions (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.content_items(id) on delete cascade,
  snapshot jsonb not null,
  saved_at timestamptz not null default now(),
  saved_by uuid references auth.users(id)
);
alter table public.content_revisions enable row level security;
drop policy if exists revisions_admin_read on public.content_revisions;
create policy revisions_admin_read on public.content_revisions
  for select to authenticated using (public.is_admin());

create or replace function public.snapshot_content() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.content_revisions(item_id, snapshot, saved_by)
    values (old.id, to_jsonb(old), auth.uid());
  -- chỉ giữ 20 bản gần nhất cho mỗi bài
  delete from public.content_revisions
   where item_id = old.id and id not in (
     select id from public.content_revisions where item_id = old.id
     order by saved_at desc limit 20);
  return old;
end $$;
drop trigger if exists content_items_revision on public.content_items;
create trigger content_items_revision
  after update on public.content_items
  for each row execute function public.snapshot_content();

-- ---------------------------------------------------------------------------
-- 11. RPC: TẠO KỲ THI (server giữ đáp án, client không bao giờ thấy)
-- ---------------------------------------------------------------------------
create or replace function public.start_quiz(
  p_mode text, p_topic text default null, p_character uuid default null,
  p_session uuid default null, p_count integer default 15, p_minutes integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  exam_id uuid; q_ids uuid[]; q_json jsonb; char_payload jsonb;
  need_correct integer; cnt integer;
begin
  if auth.uid() is null then raise exception 'Phải đăng nhập để làm bài.'; end if;
  if p_mode = 'unlock' then
    select payload into char_payload from public.content_items
      where id = p_character and kind = 'characters' and published and visible;
    if char_payload is null then raise exception 'Không tìm thấy nhân vật.'; end if;
    if exists (select 1 from public.character_unlocks
               where user_id = auth.uid() and character_id = p_character) then
      return jsonb_build_object('alreadyUnlocked', true);
    end if;
    need_correct := coalesce((char_payload->>'unlock_count')::int, 7);
    select array_agg(id) into q_ids from (
      select id from public.content_items c
        where kind = 'questions' and published
          and (char_payload->>'region' is null
               or char_payload->>'region' = 'all'
               or c.region = char_payload->>'region'
               or c.region = 'all')
        order by random() limit need_correct) s;
    if coalesce(array_length(q_ids,1),0) < need_correct then
      -- không đủ câu đúng chủ đề => lấy bù từ toàn bộ ngân hàng đã xuất bản
      select array_agg(id) into q_ids from (
        select id from public.content_items
          where kind = 'questions' and published order by random() limit need_correct) s;
    end if;
  else
    select array_agg(id) into q_ids from (
      select id from public.content_items c
        where kind = 'questions' and published
          and (p_topic is null or p_topic = 'all'
               or c.region = p_topic or c.period = p_topic or c.region = 'all')
        order by random() limit least(greatest(p_count,1), 50)) s;
  end if;
  if q_ids is null or array_length(q_ids,1) = 0 then
    raise exception 'Ngân hàng câu hỏi chưa có dữ liệu đã xuất bản. Admin cần thêm câu hỏi.';
  end if;

  -- Trả về câu hỏi + phương án ĐÃ TRỘN, tuyệt đối không kèm field 'answer'.
  -- Trộn bằng cột random() tính sẵn trong subquery (an toàn với connection pool).
  select jsonb_agg(jsonb_build_object(
      'id', x.id, 'question', x.question, 'options', x.options))
    into q_json
  from (
    select c.id, c.title as question,
      (select array_agg(val order by random())
         from jsonb_array_elements_text(c.payload->'options') as val) as options
    from public.content_items c
    where c.id = any(q_ids)
    order by random()
  ) x;

  insert into public.quiz_exams(user_id, mode, topic, character_id, research_session_id,
      question_ids, minute_limit, expires_at)
    values (auth.uid(), p_mode, p_topic, p_character, p_session, q_ids, p_minutes,
      case when p_minutes is not null then now() + make_interval(mins => p_minutes) end)
    returning id into exam_id;

  return jsonb_build_object('examId', exam_id, 'questions', q_json,
    'deadline', (select expires_at from public.quiz_exams where id = exam_id));
end $$;

-- ---------------------------------------------------------------------------
-- 12. RPC: NỘP BÀI — CHẤM TRÊN SERVER, CỘNG ĐIỂM + MỞ KHÓA THẺ
-- ---------------------------------------------------------------------------
create or replace function public.submit_quiz(
  p_exam uuid, p_answers jsonb) -- {"<question-uuid>": "<phuong an dung>", ...}
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  exam public.quiz_exams; q record; given text; correct boolean;
  right_count integer := 0; total integer; gained integer := 0;
  feedback jsonb := '[]'::jsonb; unlocked boolean := false;
  need integer; ok boolean; late boolean := false;
begin
  select * into exam from public.quiz_exams where id = p_exam
    for update; -- khóa kỳ thi, chống nộp 2 lần
  if exam is null or exam.user_id <> auth.uid() then
    raise exception 'Kỳ thi không hợp lệ.';
  end if;
  if exam.submitted_at is not null then
    return jsonb_build_object('score', exam.score, 'total', exam.total,
      'alreadySubmitted', true, 'feedback', exam.answers);
  end if;
  if exam.expires_at is not null and now() > exam.expires_at + interval '2 minutes' then
    late := true; -- vẫn chấm phần đã trả lời, chỉ là quá thời gian cho phép
  end if;

  total := coalesce(array_length(exam.question_ids, 1), 0);
  for q in select c.id, c.title, c.payload from public.content_items c
             where c.id = any(exam.question_ids) loop
    given := p_answers ->> q.id::text;
    correct := given is not null and given = (q.payload->>'answer');
    if correct then right_count := right_count + 1; end if;
    feedback := feedback || jsonb_build_object(
      'id', q.id, 'question', q.title, 'answered', given, 'correct', correct,
      'answer', q.payload->>'answer', 'explanation', coalesce(q.payload->>'explanation',''));
  end loop;

  update public.quiz_exams set submitted_at = now(), score = right_count,
    total = total, answers = p_answers where id = p_exam;

  -- ================= QUY TẮC ĐIỂM (công khai, chỉ server cộng) =================
  -- quiz topic/sum:  +5 điểm cho mỗi câu đúng  (đã có trần 150đ/ngày trong award_points)
  -- unlock thành công: +points của thẻ (basic 10 / rare 20 / epic 30 / legend 50)
  -- pretest/posttest: không cộng điểm để không ảnh hưởng biến số nghiên cứu
  -- ==============================================================================
  if exam.mode = 'unlock' then
    select coalesce((payload->>'unlock_count')::int, total) into need
      from public.content_items where id = exam.character_id;
    need := coalesce(need, total);
    -- Yêu cầu đề ra: trả lời ĐỦ và ĐÚNG TOÀN BỘ mới mở khóa.
    ok := (not late)
          and right_count >= need
          and jsonb_array_length(feedback) = total
          and right_count = total
          and (select count(*) from jsonb_array_elements(feedback) e
               where e->>'answered' is null) = 0;
    if ok then
      insert into public.character_unlocks(user_id, character_id)
        values (auth.uid(), exam.character_id) on conflict do nothing;
      unlocked := true;
      gained := coalesce((select (payload->>'points')::int from public.content_items
                          where id = exam.character_id), 30);
      gained := public.award_points(auth.uid(), 'unlock', gained, p_exam::text);
    end if;
    return jsonb_build_object('score', right_count, 'total', total, 'correct', right_count,
      'unlocked', unlocked, 'pointsGained', gained, 'late', late, 'need', need,
      'needAllCorrect', true, 'feedback', feedback);
  end if;

  if exam.mode in ('topic','general') then
    gained := public.award_points(auth.uid(),
      'quiz_' || exam.mode, right_count * 5, p_exam::text);
  end if;

  -- Pre/Post test cho nghiên cứu: ghi điểm chuẩn hóa vào session (không cộng điểm tích lũy)
  if exam.mode in ('pretest','posttest') and exam.research_session_id is not null then
    update public.research_sessions
       set pre_score  = case when exam.mode = 'pretest'  then round(right_count * 100.0 / greatest(total,1)) else pre_score end,
           post_score = case when exam.mode = 'posttest' then round(right_count * 100.0 / greatest(total,1)) else post_score end,
           phase = case when exam.mode = 'posttest' then 'done' else 'post' end
     where id = exam.research_session_id and user_id = auth.uid();
  end if;

  return jsonb_build_object('score', right_count, 'total', total, 'correct', right_count,
    'pointsGained', gained, 'late', late, 'feedback', feedback);
end $$;

-- ---------------------------------------------------------------------------
-- 13. RPC: NỘP PRE/POST TEST cho nghiên cứu KHKT (chỉ Admin qua dashboard)
-- ---------------------------------------------------------------------------
create or replace function public.record_research_score(
  p_session uuid, p_phase text, p_score numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Không có quyền.'; end if;
  update public.research_sessions
     set pre_score  = case when p_phase = 'pre'  then p_score else pre_score end,
         post_score = case when p_phase = 'post' then p_score else post_score end,
         phase = case when p_phase = 'post' then 'done' else 'pre' end
   where id = p_session;
  insert into public.admin_logs(actor_id, action, target, detail)
    values (auth.uid(), 'research_score', p_session::text, p_phase || ':' || p_score::text);
end $$;

-- ---------------------------------------------------------------------------
-- 14. Thống kê cho Admin dashboard
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
declare out jsonb;
begin
  if not public.is_admin() then raise exception 'Không có quyền.'; end if;
  select jsonb_build_object(
    'users',        (select count(*) from auth.users),
    'events',       (select count(*) from content_items where kind='events' and published),
    'questions',    (select count(*) from content_items where kind='questions'),
    'characters',   (select count(*) from content_items where kind='characters'),
    'maps',         (select count(*) from content_items where kind='maps'),
    'attempts',     (select count(*) from quiz_exams),
    'unlocks',      (select count(*) from character_unlocks),
    'research',     (select count(*) from research_sessions),
    'feedback_new', (select count(*) from feedback where status='new'),
    'avg_score',    (select round(avg(score::numeric / greatest(total,1) * 100), 1)
                       from quiz_exams where submitted_at is not null)
  ) into out;
  return out;
end $$;

-- ---------------------------------------------------------------------------
-- 15. Sao lưu / khôi phục: xuất toàn bộ CMS (admin) — chạy qua SQL editor
--     hoặc nút trong Admin. Hàm trả JSON để download.
-- ---------------------------------------------------------------------------
create or replace function public.cms_export() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'items', coalesce(jsonb_agg(to_jsonb(content_items) order by kind, sort_order), '[]'::jsonb),
    'unlock_count', (select count(*) from character_unlocks))
  from public.content_items where public.is_admin()
$$;

-- ---------------------------------------------------------------------------
-- 16. SIẾT quiz_attempts legacy: client KHÔNG được tự insert điểm nữa.
--     (Điểm chính thức từ nay nằm ở quiz_exams do RPC chấm.)
-- ---------------------------------------------------------------------------
alter table public.quiz_attempts enable row level security;
drop policy if exists quiz_own_insert on public.quiz_attempts;
drop policy if exists quiz_attempts_insert on public.quiz_attempts;
-- Chỉ admin được ghi bảng legacy này (để đối soát dữ liệu cũ); user chỉ đọc.
drop policy if exists quiz_attempts_admin_write on public.quiz_attempts;
create policy quiz_attempts_admin_write on public.quiz_attempts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Locks: admin được gỡ khóa nhầm cho user (ít gặp) qua hàm này
create or replace function public.revoke_unlock(p_user uuid, p_character uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Không có quyền.'; end if;
  delete from public.character_unlocks where user_id = p_user and character_id = p_character;
end $$;

-- Admin cộng/trừ điểm thưởng tay (thưởng cuộc thi, sửa sai): đi qua ledger + log,
-- không có đường tắt sửa profiles.points trực tiếp từ client.
create or replace function public.admin_adjust_points(p_user uuid, p_delta integer, p_reason text)
returns integer language plpgsql security definer set search_path = public as $$
declare new_total integer;
begin
  if not public.is_admin() then raise exception 'Không có quyền.'; end if;
  if p_delta is null or p_delta = 0 or char_length(coalesce(p_reason,'')) < 3 then
    raise exception 'Cần số điểm khác 0 và lý do (>= 3 ký tự).';
  end if;
  if p_delta > 0 then
    new_total := coalesce(public.award_points(p_user, 'admin_award', least(p_delta, 100), md5(random()::text || clock_timestamp()::text)), 0);
  else
    update public.profiles set points = greatest(0, points + p_delta) where id = p_user
      returning points into new_total;
    insert into public.point_ledger(user_id, reason, amount, ref_id)
      values (p_user, 'admin_penalty', p_delta, md5(random()::text || clock_timestamp()::text));
  end if;
  select points into new_total from public.profiles where id = p_user;
  insert into public.admin_logs(actor_id, action, target, detail)
    values (auth.uid(), 'adjust_points', p_user::text, p_delta::text || ' (' || p_reason || ')');
  return new_total;
end $$;

