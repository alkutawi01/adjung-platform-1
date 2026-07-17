-- Migration: add optional onboarding-interest fields to identities.
-- Captures Topic Interests, Preferred Language(s), and Preferred Edition collected
-- during the "Your Interests" signup step.
--
-- preferred_edition is intentionally inert: no Edition/Composition Engine exists
-- yet to consume it (confirmed via full-repo search, 2026-07-17). The value is
-- stored so it isn't discarded, purely for a future feature — it powers nothing
-- today.
--
-- Safe to re-run: `add column if not exists` is a no-op once columns exist.

alter table identities add column if not exists interests text[] default '{}';
alter table identities add column if not exists preferred_languages text[] default '{}';
alter table identities add column if not exists preferred_edition text;
