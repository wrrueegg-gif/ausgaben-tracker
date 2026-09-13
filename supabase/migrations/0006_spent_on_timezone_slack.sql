-- PROJ-2 — follow-up to the QA finding on the timezone break between app and database.
--
-- The app decides "today" in Europe/Zurich (src/lib/validation/expense.ts), the
-- database checked against its own current_date, which runs in UTC. Between 00:00
-- and 02:00 Swiss time those two disagree: the date the form pre-fills is already
-- tomorrow for the database, the insert is refused, and the person only sees
-- "Die Ausgabe konnte nicht gespeichert werden".
--
-- Which of the two is right depends on where the person sits, so the database
-- cannot answer it. It goes back to being what a database check should be — a
-- sanity bound that keeps an expense out of next year — while the product rule
-- "no expenses in the future" stays where it can be explained to a person, in the
-- app (EC-5). One day of slack covers every timezone the product is aimed at.

alter table public.expenses drop constraint if exists expenses_spent_on_check;

alter table public.expenses
  add constraint expenses_spent_on_check
  check (spent_on <= current_date + 1);
