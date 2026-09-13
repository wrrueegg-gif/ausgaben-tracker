-- PROJ-3 — Fremdwährung & Wechselkurse
-- Serves AC-2, AC-3, AC-5, AC-10, EC-4.
--
-- amount_chf keeps its meaning and stays the column everything is summed from.
-- The four new columns record what the person actually paid and with which rate
-- it was converted, so the number stays checkable years later (AC-5).

alter table public.expenses
  add column if not exists currency text not null default 'CHF',
  -- Defaults derived from the existing row, so the table is consistent in one
  -- step and nobody has to remember a follow-up data migration.
  add column if not exists amount_original numeric(12, 2),
  add column if not exists exchange_rate   numeric(18, 8) not null default 1,
  add column if not exists rate_date       date;

update public.expenses set amount_original = amount_chf where amount_original is null;
update public.expenses set rate_date = spent_on where rate_date is null;

alter table public.expenses
  alter column amount_original set not null,
  alter column rate_date set not null;

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.expenses'::regclass
                   and conname = 'expenses_currency_check') then
    alter table public.expenses add constraint expenses_currency_check
      check (currency in ('CHF', 'EUR', 'USD', 'GBP'));
  end if;

  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.expenses'::regclass
                   and conname = 'expenses_amount_original_check') then
    alter table public.expenses add constraint expenses_amount_original_check
      check (amount_original > 0);
  end if;

  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.expenses'::regclass
                   and conname = 'expenses_exchange_rate_check') then
    alter table public.expenses add constraint expenses_exchange_rate_check
      check (exchange_rate > 0);
  end if;

  -- The one combination that would silently produce wrong totals: a franc amount
  -- that was multiplied by something.
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.expenses'::regclass
                   and conname = 'expenses_chf_rate_is_one_check') then
    alter table public.expenses add constraint expenses_chf_rate_is_one_check
      check (currency <> 'CHF' or exchange_rate = 1);
  end if;
end $$;

comment on column public.expenses.amount_original is
  'What the person paid, in the currency of the currency column.';
comment on column public.expenses.exchange_rate is
  'Francs per unit of that currency, frozen at capture time (AC-5). Exactly 1 for CHF.';
comment on column public.expenses.rate_date is
  'The day this rate was published — earlier than spent_on for a weekend purchase (EC-1).';
