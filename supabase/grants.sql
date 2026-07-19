-- ============================================================
-- ADJUNG PLATFORM — API role grants
-- RLS policies (policies.sql) still govern row-level access;
-- these GRANTs just allow anon/authenticated roles to reach the
-- tables at all via PostgREST.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  users,
  profiles,
  identities,
  biography_items,
  digital_signatures,
  entries,
  footnotes,
  margin_notes,
  citations,
  entry_citations,
  revisions,
  published_representations,
  system_logs,
  policy_documents,
  policy_sections,
  release_logs,
  system_settings,
  layout_settings
to anon, authenticated;
