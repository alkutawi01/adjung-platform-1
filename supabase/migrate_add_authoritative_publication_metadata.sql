-- SPEC-028 §14.1 — move serial_no / current_version / reading_time from
-- ad-hoc client-side computation (FolioView.tsx and EntryRenderer.tsx each
-- computed these independently and had already drifted apart) into
-- authoritative, DB-stored columns. Renderers should only ever read these
-- values now, never recompute them.

-- ============================================================
-- 1. Columns
-- ============================================================
alter table entries
  add column if not exists serial_no integer,
  add column if not exists current_version text,
  add column if not exists reading_time_minutes integer;

-- A published entry's serial number must be unique per author. Drafts have
-- no serial_no (null), so the partial index only constrains published work.
create unique index if not exists idx_entries_author_serial
  on entries(author_id, serial_no)
  where serial_no is not null;

-- ============================================================
-- 2. serial_no — assigned once, atomically, at first publish
-- ============================================================
create or replace function assign_entry_serial_no()
returns trigger as $$
begin
  if new.status = 'Published' and new.serial_no is null then
    -- FOR UPDATE locks this author's existing rows for the duration of the
    -- transaction, so two concurrent first-publishes by the same author
    -- can't race to the same serial_no.
    select coalesce(max(serial_no), -1) + 1
      into new.serial_no
      from entries
      where author_id = new.author_id
      for update;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assign_entry_serial_no on entries;
create trigger trg_assign_entry_serial_no
  before insert or update on entries
  for each row
  execute function assign_entry_serial_no();

-- ============================================================
-- 3. reading_time_minutes / current_version — derived, recomputed on write
-- ============================================================
-- reading_time_minutes: 200 words/minute, recomputed whenever content
-- actually changes (covers autosave, publish, and later revisions alike —
-- simpler and more robust than only recomputing at publish time).
--
-- current_version: mirrors the app's existing (already-live) heuristic —
-- v1.0 if never edited past publish, v1.1 if edited the same calendar day
-- as publish, v2.0 if edited on a later day. Only meaningful once
-- published; stays null for drafts.
create or replace function update_entry_derived_metadata()
returns trigger as $$
declare
  word_count integer;
begin
  if new.content is distinct from old.content or old.content is null then
    if coalesce(trim(new.content), '') = '' then
      new.reading_time_minutes := 0;
    else
      word_count := array_length(regexp_split_to_array(trim(new.content), '\s+'), 1);
      new.reading_time_minutes := greatest(1, ceil(word_count / 200.0))::integer;
    end if;
  end if;

  if new.status = 'Published' and new.published_date is not null then
    if new.updated_date is null or date_trunc('day', new.updated_date) = date_trunc('day', new.published_date) then
      if new.updated_date is not null and new.updated_date - new.published_date > interval '1 second' then
        new.current_version := 'v1.1';
      else
        new.current_version := 'v1.0';
      end if;
    else
      new.current_version := 'v2.0';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_entry_derived_metadata on entries;
create trigger trg_update_entry_derived_metadata
  before insert or update on entries
  for each row
  execute function update_entry_derived_metadata();

-- ============================================================
-- 4. Backfill existing rows
-- ============================================================
-- serial_no: assign in chronological order per author, matching the
-- ordering the client already used (sortedPublished by published_date asc).
-- Done as an explicit loop (not a single bulk UPDATE) because a bulk
-- statement processes rows in undefined order, which would assign serial
-- numbers out of chronological order.
do $$
declare
  r record;
  seq integer := 0;
  cur_author uuid := null;
begin
  for r in
    select id, author_id
    from entries
    where status = 'Published' and serial_no is null
    order by author_id, published_date asc nulls last, created_date asc
  loop
    if cur_author is null or r.author_id is distinct from cur_author then
      cur_author := r.author_id;
      seq := 0;
    else
      seq := seq + 1;
    end if;
    update entries set serial_no = seq where id = r.id;
  end loop;
end $$;

-- reading_time_minutes: no ordering dependency, safe as one bulk statement.
update entries
set reading_time_minutes = case
    when coalesce(trim(content), '') = '' then 0
    else greatest(1, ceil(array_length(regexp_split_to_array(trim(content), '\s+'), 1) / 200.0))::integer
  end
where reading_time_minutes is null;

-- current_version: same day-vs-different-day heuristic as the trigger.
update entries
set current_version = case
    when updated_date is null or date_trunc('day', updated_date) = date_trunc('day', published_date) then
      case when updated_date is not null and updated_date - published_date > interval '1 second' then 'v1.1' else 'v1.0' end
    else 'v2.0'
  end
where status = 'Published' and published_date is not null and current_version is null;
