-- PROJ-3 — follow-up to the QA finding on EC-5.
--
-- Until now only the disabled button protected against a second identical row.
-- That covers a double click and nothing else: a repeated POST, a browser retry
-- or a client without JavaScript would still create two expenses and double the
-- monthly total.
--
-- The fix is a key the form carries, not a uniqueness rule over the values: two
-- coffees on the same day for the same amount are a legitimate pair of rows
-- (design.md, "Keine Eindeutigkeitsregel gegen doppelte Ausgaben"), so the values
-- must stay free to repeat. One submission of one form instance may reach the
-- database once — that is what this index says.

alter table public.expenses
  add column if not exists submission_id uuid;

comment on column public.expenses.submission_id is
  'Identifies one submission of one form instance. Makes saving idempotent (EC-5) without forbidding two genuinely identical expenses, which come from separate form instances.';

-- Partial: rows written before this column existed carry NULL and must not collide.
create unique index if not exists expenses_user_submission_idx
  on public.expenses (user_id, submission_id)
  where submission_id is not null;
