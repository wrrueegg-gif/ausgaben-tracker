-- PROJ-1 — follow-up to 0001, raised by the database security advisor.
--
-- Postgres grants EXECUTE on a new function to PUBLIC by default, so
-- public.handle_new_user() was reachable over the REST API as
-- /rest/v1/rpc/handle_new_user. It is a trigger function and a direct call
-- fails, but a SECURITY DEFINER function that anyone can reach is not something
-- to leave standing. It is only ever invoked by the trigger, which runs as the
-- table owner and does not need the grant.
--
-- public.delete_own_account() keeps its grant to `authenticated` on purpose:
-- that call is the feature (AC-13), and it acts only on auth.uid().
--
-- 0001 is already applied, so this corrects forward instead of editing it.

revoke all on function public.handle_new_user() from public, anon, authenticated;
