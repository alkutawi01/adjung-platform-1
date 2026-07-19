-- ============================================================
-- Fixes the same "Acting Scriptor" silent-save-failure bug as
-- migrate_add_editor_manage_ai_accounts_policy.sql, but for a set of
-- tables that migration missed: footnotes, margin_notes, revisions,
-- published_representations, entry_citations.
--
-- entries itself already carries "Editors manage all entries" (see
-- policies.sql), which is why an entry's title/content/status always
-- saved fine under Acting Scriptor. But its five child tables only ever
-- had "Authors manage own X" (entry_id in (select id from entries where
-- author_id = current_app_user_id())) -- so the moment a Chief Editor
-- acting as an AI Scriptor tried to save a footnote or margin note, the
-- INSERT was rejected by RLS (Postgres error 42501) because
-- current_app_user_id() resolves to the *real* session, not the
-- AI persona being acted as. saveEntry() in supabaseService.ts never
-- checked the error on these specific calls, so the rejection was
-- completely invisible -- the entry appeared to save, but the footnote/
-- margin-note content was silently dropped every time.
--
-- Fix: extend the same "Editors manage all entries" pattern to each of
-- these five child tables.
-- ============================================================

drop policy if exists "Editors manage all entry footnotes" on footnotes;
create policy "Editors manage all entry footnotes"
  on footnotes for all
  using (current_app_user_role() in ('Editor', 'Chief Editor'));

drop policy if exists "Editors manage all margin notes" on margin_notes;
create policy "Editors manage all margin notes"
  on margin_notes for all
  using (current_app_user_role() in ('Editor', 'Chief Editor'));

drop policy if exists "Editors manage all revisions" on revisions;
create policy "Editors manage all revisions"
  on revisions for all
  using (current_app_user_role() in ('Editor', 'Chief Editor'));

drop policy if exists "Editors manage all representations" on published_representations;
create policy "Editors manage all representations"
  on published_representations for all
  using (current_app_user_role() in ('Editor', 'Chief Editor'));

drop policy if exists "Editors manage all entry citations" on entry_citations;
create policy "Editors manage all entry citations"
  on entry_citations for all
  using (current_app_user_role() in ('Editor', 'Chief Editor'));
