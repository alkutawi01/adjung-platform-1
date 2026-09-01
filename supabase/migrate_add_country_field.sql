-- Adds a real, structured Country field for writers, replacing the old
-- Directory hack that guessed a country by splitting the free-text
-- Affiliation field on its last comma.
--
-- Run this by hand in the Supabase SQL editor — schema changes here are
-- not part of the app's auto-deploy. The app degrades gracefully if this
-- hasn't been run yet (country is simply omitted from saves), so there's
-- no urgency, but Country won't persist until it's applied.

ALTER TABLE users ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE identities ADD COLUMN IF NOT EXISTS country text;
