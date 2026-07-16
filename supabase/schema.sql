-- ============================================================
-- ADJUNG PLATFORM — PostgreSQL Schema (Supabase)
-- Migrated from Firestore flat-document model to normalized relations.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. USERS  (mirrors Supabase auth.users via id FK)
-- ============================================================
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  username text unique not null,
  email text unique not null,
  role text not null check (role in ('Chief Editor', 'Editor', 'Writer', 'Visitor')),
  pen_name text not null,
  signature text,
  avatar_color text,
  bio_summary text,
  suspended boolean default false,
  affiliation text,
  is_ai boolean default false,
  subdomain_approved_early boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. WRITER PROFILES (1:1 with users)
-- ============================================================
create table profiles (
  author_id uuid primary key references users(id) on delete cascade,
  hero_title text,
  hero_subtitle text
);

-- ============================================================
-- 3. IDENTITIES (biography / public presence)
-- ============================================================
create table identities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid unique not null references users(id) on delete cascade,
  username text not null,
  display_name text,
  pen_name text,
  biography text,
  public_visibility text default 'Public' check (public_visibility in ('Public', 'Private')),
  affiliation text
);

create table biography_items (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references identities(id) on delete cascade,
  year text,
  title text,
  description text,
  category text check (category in ('Education', 'Career', 'Publication', 'Award', 'Personal', 'Other')),
  sort_order int default 0
);

create table digital_signatures (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references identities(id) on delete cascade,
  label text,
  status text check (status in ('Archived', 'Default')),
  type text check (type in ('drawn', 'typed')),
  typed_text text,
  font_family text,
  strokes jsonb,
  pen_style jsonb,
  typography_style jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- 4. ENTRIES (Note / Essay / Article / Notice / Editor's Note)
-- ============================================================
create table entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references users(id) on delete set null,
  publication_class text check (publication_class in ('Scholarly', 'Institutional')),
  publisher text,
  content_type text not null check (content_type in ('Note', 'Essay', 'Notice', 'Editor''s Note')),
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Archived')),
  visibility text not null default 'Private' check (visibility in ('Public', 'Private')),
  title text,
  subtitle text,
  slug text not null,
  canonical_url text,
  content text,
  excerpt text,
  featured_image text,
  tags text[] default '{}',
  language text,
  primary_script text,
  direction text,
  layout_variant text check (layout_variant in ('melintang', 'menegak', 'kompak', 'penuh')),
  reference_sort_order text check (reference_sort_order in ('alphabetical', 'appearance')),
  reference_style text,
  signature_version_id uuid,

  -- Institutional metadata
  priority text check (priority in ('High', 'Normal', 'Low')),
  effective_from timestamptz,
  effective_until timestamptz,
  is_pinned boolean default false,
  editorial_category text,
  is_institutional boolean default false,
  discipline text,
  under_review boolean default false,

  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  published_date timestamptz,

  unique (author_id, slug)
);

create index idx_entries_author on entries(author_id);
create index idx_entries_status_visibility on entries(status, visibility);
create index idx_entries_content_type on entries(content_type);

-- ============================================================
-- 5. FOOTNOTES & MARGIN NOTES (structured, not JSON blobs)
-- ============================================================
create table footnotes (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  label text,
  content text,
  sort_order int default 0
);

create table margin_notes (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  block_key text not null, -- corresponds to marginNotesData key
  content text
);

-- ============================================================
-- 6. REFERENCES / CITATIONS (many-to-many: entries <-> citations)
-- ============================================================
create table citations (
  id uuid primary key default gen_random_uuid(),
  author text,
  title text,
  year int,
  publisher text,
  url text,
  doi text,
  isbn text
);

create table entry_citations (
  entry_id uuid not null references entries(id) on delete cascade,
  citation_id uuid not null references citations(id) on delete cascade,
  sort_order int default 0,
  primary key (entry_id, citation_id)
);

-- ============================================================
-- 7. VERSION HISTORY (Revisions)
-- ============================================================
create table revisions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  title text,
  content text,
  excerpt text,
  featured_image text,
  status text,
  visibility text,
  tags text[],
  slug text,
  timestamp timestamptz default now()
);

-- ============================================================
-- 8. PUBLISHED REPRESENTATIONS (compiled layout output)
-- ============================================================
create table published_representations (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  version int default 1,
  representation_type text,
  representation_data jsonb,
  svg_data text,
  template text,
  compiled_at timestamptz default now(),
  pipeline_version text,
  source_editor text,
  spec_version text,
  source_template text
);

-- ============================================================
-- 9. EDITORIAL / SYSTEM LOGS (audit trail)
-- ============================================================
create table system_logs (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references users(id) on delete set null,
  role text,
  action text,
  timestamp timestamptz default now()
);

-- ============================================================
-- 10. INSTITUTIONAL POLICY DOCUMENTS
-- ============================================================
create table policy_documents (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('Publishing', 'Editorial', 'AI', 'Community', 'Citation')),
  title text,
  last_updated timestamptz default now()
);

create table policy_sections (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policy_documents(id) on delete cascade,
  title text,
  content text,
  sort_order int default 0
);

-- ============================================================
-- 11. RELEASE LOGS (changelog)
-- ============================================================
create table release_logs (
  id uuid primary key default gen_random_uuid(),
  version text,
  date timestamptz,
  added text[],
  improved text[],
  fixed text[],
  deprecated text[]
);

-- ============================================================
-- 12. SYSTEM SETTINGS (singleton row)
-- ============================================================
create table system_settings (
  id int primary key default 1,
  academic_affiliation text,
  editorial_policy text,
  accent_color text,
  allow_self_registration boolean default true,
  featured_scholar_id uuid,
  featured_entry_id uuid,
  featured_essay_ids uuid[],
  featured_note_ids uuid[],
  editorial_selection_ids uuid[],
  announcement_banner text,
  enable_arabic_accent boolean default false,
  layout_density text check (layout_density in ('Standard', 'Compact', 'Classical')),
  allowed_signature_fonts text[],
  role_permissions jsonb,
  in_the_news_google_doc_url text,
  world_clock_holidays_google_doc_url text,
  research_findings_google_doc_url text,
  google_doc_sync_times text,
  in_the_news_cached_text text,
  in_the_news_last_fetched timestamptz,
  world_clock_cached_text text,
  world_clock_last_fetched timestamptz,
  research_findings_cached_text text,
  research_findings_last_fetched timestamptz,
  constraint single_row check (id = 1)
);

-- ============================================================
-- ROW LEVEL SECURITY (enable on all tables; policies added separately)
-- ============================================================
alter table users enable row level security;
alter table profiles enable row level security;
alter table identities enable row level security;
alter table biography_items enable row level security;
alter table digital_signatures enable row level security;
alter table entries enable row level security;
alter table footnotes enable row level security;
alter table margin_notes enable row level security;
alter table citations enable row level security;
alter table entry_citations enable row level security;
alter table revisions enable row level security;
alter table published_representations enable row level security;
alter table system_logs enable row level security;
alter table policy_documents enable row level security;
alter table policy_sections enable row level security;
alter table release_logs enable row level security;
alter table system_settings enable row level security;
