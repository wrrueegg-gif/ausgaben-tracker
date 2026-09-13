-- PROJ-1 — Benutzerkonto & Login
-- Serves AC-8 (profile is created automatically), AC-9 (owner-only access),
-- AC-13 (delete own account) and EC-6 (account and profile are one operation).

-- 1. The profile that belongs to an auth account -----------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text        not null check (char_length(display_name) between 1 and 60),
  created_at   timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth account. Created by the handle_new_user trigger, removed with the account.';

alter table public.profiles enable row level security;

-- Owner-only access. No INSERT and no DELETE policy exists on purpose:
-- rows are created by the trigger below and removed by the cascade from auth.users.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 2. Profile creation runs inside the signup transaction ---------------------
-- EC-6: either the account and its profile both exist, or neither does.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(split_part(new.email, '@', 1), ''), 'user'), 60)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Deleting your own account ----------------------------------------------
-- AC-13. Runs with elevated rights but takes no parameters and only ever acts
-- on auth.uid(), so it cannot be pointed at someone else's account. This is what
-- lets the app delete accounts without ever holding a service-role key.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  delete from auth.users where id = caller;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
