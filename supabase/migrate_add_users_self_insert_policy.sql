-- Migration: allow self-registration to actually insert its own users row.
--
-- `users` had an UPDATE policy ("own row") and an ALL policy restricted to
-- Chief Editor, but no INSERT policy — so RLS's default-deny blocked every
-- self-signup from ever creating its own account row. This was previously
-- masked by an unrelated app bug that generated a non-UUID id, which failed
-- with a Postgres type error before the RLS check was ever reached; fixing
-- that bug (2026-07-17 signup wizard rework) exposed this policy gap.
--
-- `role = 'Writer'` is required in the check so a signed-up client can't
-- insert itself as 'Chief Editor'/'Editor' — self-registration only ever
-- produces Writer accounts; role changes still require the Chief-Editor-only
-- policy below.
--
-- Safe to re-run: drops the policy before recreating it.

drop policy if exists "Users can insert their own row during signup" on users;

create policy "Users can insert their own row during signup"
  on users for insert
  with check (
    auth_user_id = auth.uid()
    and role = 'Writer'
  );
