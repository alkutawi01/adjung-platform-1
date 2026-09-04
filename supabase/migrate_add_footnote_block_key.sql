-- Footnote text is lost on every reload: the footnotes table has never had
-- anywhere to store the fn-xxx marker id that the entry's content actually
-- references (via [^fn-xxx]). On save, saveEntry() only ever wrote
-- label/content/sort_order; on load, the code fell back to the row's own
-- auto-generated primary key as if it were that marker id, which it never
-- is, so getOrderedFootnotesToRender()'s lookup by marker id always misses
-- and every footnote renders with empty text after a reload or publish.
--
-- margin_notes already solved the identical problem with its own
-- block_key column ("corresponds to marginNotesData key") — this mirrors
-- that exact pattern for footnotes.
--
-- Existing footnote rows have no way to recover their original marker id
-- (it was never stored), so this cannot be backfilled — any footnote text
-- entered before this migration is already gone from the DB. New/edited
-- footnotes are fixed going forward once this migration runs and the
-- matching code (supabaseService.ts) deploys.

alter table footnotes add column block_key text;
