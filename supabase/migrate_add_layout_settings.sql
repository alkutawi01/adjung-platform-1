-- Adds a Chief-Editor-editable layout settings table, keyed by content type.
-- Lets the Layout Inspector panel (EntryRenderer.tsx) persist reading column
-- width, margin-note width, padding, alignment, paragraph spacing, and line
-- height per content type, instead of these being hardcoded in
-- src/presentation/*.ts. Card width is NOT stored — it's always computed
-- from padding + column + margin note (see computeReadingLayout in utils.tsx).
--
-- Run this in Supabase Dashboard -> SQL Editor. Idempotent (safe to re-run).

create table if not exists layout_settings (
  content_type text primary key,
  alignment text not null default 'left' check (alignment in ('left', 'justify')),
  column_width int not null,
  margin_note_width int not null default 260,
  padding int not null default 32,
  spacing_before int not null default 0,
  spacing_after int not null default 24,
  line_height numeric not null default 1.65,
  updated_at timestamptz default now()
);

alter table layout_settings enable row level security;

drop policy if exists "Layout settings are publicly readable" on layout_settings;
create policy "Layout settings are publicly readable"
  on layout_settings for select using (true);

drop policy if exists "Chief Editor manages layout settings" on layout_settings;
create policy "Chief Editor manages layout settings"
  on layout_settings for all
  using (current_app_user_role() = 'Chief Editor');

-- RLS policies alone aren't enough — Postgres also needs the anon/authenticated
-- API roles to have table-level privileges (this is separate from and on top
-- of RLS; see supabase/grants.sql). Without this, every request fails with
-- "permission denied for table layout_settings" before RLS is even checked.
grant select, insert, update, delete on layout_settings to anon, authenticated;
