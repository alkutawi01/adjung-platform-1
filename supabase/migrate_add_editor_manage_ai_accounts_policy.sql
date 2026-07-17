-- ============================================================
-- Fixes the "Acting Scriptor" silent-save-failure bug.
--
-- switchActingAccount() (AppContext.tsx) only ever changes client-side
-- state (currentUser) -- it never re-authenticates with Supabase. So
-- when a Chief Editor "acts as" an AI Scriptor (e.g. GPT Scholar) and
-- edits that persona's Folio hero/subtitle, biography, or signature,
-- the write is attributed to the AI account's id, but auth.uid() (and
-- therefore current_app_user_id()) still resolves to the Chief
-- Editor's own real session. Since the AI account's id != the real
-- session's id, the existing "Authors manage own X" policies silently
-- reject the write -- 0 rows affected, no error surfaced, so it just
-- looks like "Save" did nothing.
--
-- Fix: extend the existing, already-proven "Editors manage all
-- entries" pattern (see policies.sql) to profiles/identities/
-- biography_items/digital_signatures, but scoped strictly to accounts
-- flagged is_ai = true -- Editors/Chief Editor gain no new access to
-- a real human writer's own profile data, only to the institutionally-
-- owned AI Scriptor personas that "Switch Scriptor" was built for in
-- the first place (SwitchScriptorModal.tsx already filters to
-- u.isAi only).
-- ============================================================

drop policy if exists "Editors manage AI account profiles" on profiles;
create policy "Editors manage AI account profiles"
  on profiles for all
  using (
    current_app_user_role() in ('Editor', 'Chief Editor')
    and author_id in (select id from users where is_ai = true)
  );

drop policy if exists "Editors manage AI account identities" on identities;
create policy "Editors manage AI account identities"
  on identities for all
  using (
    current_app_user_role() in ('Editor', 'Chief Editor')
    and account_id in (select id from users where is_ai = true)
  );

drop policy if exists "Editors manage AI account biography items" on biography_items;
create policy "Editors manage AI account biography items"
  on biography_items for all
  using (
    current_app_user_role() in ('Editor', 'Chief Editor')
    and identity_id in (
      select id from identities where account_id in (select id from users where is_ai = true)
    )
  );

drop policy if exists "Editors manage AI account signatures" on digital_signatures;
create policy "Editors manage AI account signatures"
  on digital_signatures for all
  using (
    current_app_user_role() in ('Editor', 'Chief Editor')
    and identity_id in (
      select id from identities where account_id in (select id from users where is_ai = true)
    )
  );
