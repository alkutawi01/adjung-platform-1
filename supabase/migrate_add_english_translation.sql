-- Adds an optional English translation for an entry's title and content.
-- Author-filled, allowed to stay completely blank. Used by the Frontpage's
-- "100% English" display mode for Featured Essays & Notes: when present,
-- the featured card shows this instead of the original title/content; when
-- blank (or the entry is already in English), the original is shown with
-- no indication a translation is missing.
--
-- IF NOT EXISTS: safe to run more than once, and safe to run against a
-- database this has already reached by another path.

alter table public.entries add column if not exists english_translation text;
alter table public.entries add column if not exists english_translation_title text;
