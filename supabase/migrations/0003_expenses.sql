-- PROJ-2 — Ausgaben & Monatsübersicht
-- Serves AC-3, AC-4, AC-6, AC-11, AC-12, EC-3, EC-4, EC-5.

create table if not exists public.expenses (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  -- numeric, not float: 0.10 + 0.20 is not 0.30 in binary floating point, and a
  -- monthly total has to be right to the centime.
  amount_chf numeric(12, 2) not null check (amount_chf > 0),
  category   text        not null check (
                 category in ('Lebensmittel', 'Wohnen', 'Mobilität',
                              'Freizeit', 'Gesundheit', 'Sonstiges')),
  -- A date, not a timestamp: a monthly report has no use for the time of day, and
  -- without it there is no timezone question. EC-5 forbids the future.
  spent_on   date        not null check (spent_on <= current_date),
  note       text        check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);

comment on table public.expenses is
  'One expense, owned by exactly one account. Removed with the account (AC-13 in PROJ-1).';

-- Every query filters by person and month; without this index it scans the table.
create index if not exists expenses_user_spent_on_idx
  on public.expenses (user_id, spent_on desc);

alter table public.expenses enable row level security;

-- AC-11, AC-12, EC-3: owner-only, enforced by the database rather than by the app.
drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own"
  on public.expenses for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- WITH CHECK on insert: without it a signed-in person could file an expense under
-- someone else's id.
drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own"
  on public.expenses for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own"
  on public.expenses for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- No UPDATE policy on purpose: this feature has no editing, so nobody may change a
-- row. Adding editing later means adding a policy, deliberately.
