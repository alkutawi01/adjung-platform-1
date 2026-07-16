-- Migration: remove 'Article' as a valid entries.content_type value.
-- Adjung's ScholarlyType is now 'Note' | 'Essay' only (Article removed platform-wide).
-- Safe to re-run: the UPDATE is a no-op once no 'Article' rows remain, and the
-- constraint is dropped with IF EXISTS before being recreated.

-- 1. Convert any existing 'Article' entries to 'Essay'.
update entries set content_type = 'Essay' where content_type = 'Article';

-- 2. Replace the CHECK constraint to no longer allow 'Article'.
alter table entries drop constraint if exists entries_content_type_check;
alter table entries add constraint entries_content_type_check
  check (content_type in ('Note', 'Essay', 'Notice', 'Editor''s Note'));
