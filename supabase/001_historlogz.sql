-- Run in Supabase SQL Editor. Back up current DB first.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'user' check(role in ('user','admin','editor')),
 display_name text,
 created_at timestamptz not null default now()
);
create or replace function public.create_profile() returns trigger language plpgsql security definer set search_path=public as $$begin insert into public.profiles(id,role) values(new.id,'user') on conflict do nothing; return new;end$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
insert into public.profiles(id,role) select id,'user' from auth.users on conflict(id) do nothing;
alter table public.profiles enable row level security;
drop policy if exists profile_read_own on public.profiles;
create policy profile_read_own on public.profiles for select to authenticated using(id=auth.uid());
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.profiles where id=auth.uid() and role='admin')$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;
create table if not exists public.content_items (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('events','maps','characters','questions','pages','announcements','research','settings')),
 title text not null,
 body text not null default '',
 image_url text,
 payload jsonb not null default '{}'::jsonb,
 published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 author_id uuid references auth.users(id)
);
create index if not exists content_items_kind_idx on public.content_items(kind,published);
create or replace function public.cms_stamp() returns trigger language plpgsql set search_path=public as $$begin new.updated_at=now();if tg_op='INSERT' then new.author_id=auth.uid();end if;return new;end$$;
drop trigger if exists cms_stamp_trigger on public.content_items;
create trigger cms_stamp_trigger before insert or update on public.content_items for each row execute function public.cms_stamp();
alter table public.content_items enable row level security;
drop policy if exists public_read_published on public.content_items;
create policy public_read_published on public.content_items for select to anon,authenticated using((published and kind not in ('research','settings','questions')) or public.is_admin());
drop policy if exists admin_insert_content on public.content_items;
create policy admin_insert_content on public.content_items for insert to authenticated with check(public.is_admin());
drop policy if exists admin_update_content on public.content_items;
create policy admin_update_content on public.content_items for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists admin_delete_content on public.content_items;
create policy admin_delete_content on public.content_items for delete to authenticated using(public.is_admin());
create table if not exists public.quiz_attempts (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 mode text not null check(mode in ('topic','general')),
 score integer not null check(score>=0),
 total integer not null check(total between 1 and 500),
 created_at timestamptz not null default now()
);
alter table public.quiz_attempts enable row level security;
drop policy if exists quiz_own_read on public.quiz_attempts;
create policy quiz_own_read on public.quiz_attempts for select to authenticated using(user_id=auth.uid() or public.is_admin());
-- Grade calculations in the legacy Quiz run client-side; DO NOT permit direct inserts until a secure server-side grader is implemented.
-- Study results should NOT use this table as authoritative until validation is added.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('historlog-media','historlog-media',true,8388608,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do nothing;
drop policy if exists media_admin_insert on storage.objects;
create policy media_admin_insert on storage.objects for insert to authenticated with check(bucket_id='historlog-media' and public.is_admin());
drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects for update to authenticated using(bucket_id='historlog-media' and public.is_admin());
drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects for delete to authenticated using(bucket_id='historlog-media' and public.is_admin());
-- Existing legacy app_storage (if present): block writes by regular users; apply only after checking existing policies.
-- DO NOT grant blanket public updates to app_storage.

-- Migration security: existing app_storage must not remain writable by the public.
DO $$ DECLARE pol record; BEGIN
 IF to_regclass('public.app_storage') IS NOT NULL THEN
  EXECUTE 'ALTER TABLE public.app_storage ENABLE ROW LEVEL SECURITY';
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='app_storage' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.app_storage',pol.policyname);
  END LOOP;
  EXECUTE 'CREATE POLICY app_storage_read ON public.app_storage FOR SELECT TO anon,authenticated USING(true)';
  EXECUTE 'CREATE POLICY app_storage_admin_write ON public.app_storage FOR ALL TO authenticated USING(public.is_admin()) WITH CHECK(public.is_admin())';
 END IF;
END $$;
