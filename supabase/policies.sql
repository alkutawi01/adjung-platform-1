-- ============================================================
-- ADJUNG PLATFORM — Row Level Security Policies
-- Philosophy: Public can read Published+Public entries.
-- Authors manage their own drafts. Editors/Chief Editor manage everything.
-- ============================================================

-- ---------- Helper: current app user id from auth.uid() ----------
create or replace function current_app_user_id()
returns uuid
language sql stable
as $$
  select id from users where auth_user_id = auth.uid()
$$;

create or replace function current_app_user_role()
returns text
language sql stable
as $$
  select role from users where auth_user_id = auth.uid()
$$;

-- ============================================================
-- USERS
-- ============================================================
create policy "Users are publicly readable (non-suspended)"
  on users for select
  using (suspended = false or auth.uid() is not null);

create policy "Users can update their own row"
  on users for update
  using (auth_user_id = auth.uid());

create policy "Chief Editor can manage all users"
  on users for all
  using (current_app_user_role() = 'Chief Editor');

-- ============================================================
-- PROFILES
-- ============================================================
create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Authors manage own profile"
  on profiles for all
  using (author_id = current_app_user_id());

-- ============================================================
-- IDENTITIES
-- ============================================================
create policy "Public identities are readable"
  on identities for select
  using (public_visibility = 'Public' or account_id = current_app_user_id());

create policy "Authors manage own identity"
  on identities for all
  using (account_id = current_app_user_id());

-- ============================================================
-- BIOGRAPHY ITEMS / DIGITAL SIGNATURES (follow parent identity)
-- ============================================================
create policy "Biography items follow identity visibility"
  on biography_items for select
  using (
    identity_id in (
      select id from identities
      where public_visibility = 'Public' or account_id = current_app_user_id()
    )
  );

create policy "Authors manage own biography items"
  on biography_items for all
  using (
    identity_id in (select id from identities where account_id = current_app_user_id())
  );

create policy "Signatures readable with identity"
  on digital_signatures for select
  using (
    identity_id in (
      select id from identities
      where public_visibility = 'Public' or account_id = current_app_user_id()
    )
  );

create policy "Authors manage own signatures"
  on digital_signatures for all
  using (
    identity_id in (select id from identities where account_id = current_app_user_id())
  );

-- ============================================================
-- ENTRIES
-- ============================================================
create policy "Published public entries are readable by anyone"
  on entries for select
  using (
    (status = 'Published' and visibility = 'Public')
    or author_id = current_app_user_id()
    or current_app_user_role() in ('Editor', 'Chief Editor')
  );

create policy "Authors manage their own entries"
  on entries for all
  using (author_id = current_app_user_id());

create policy "Editors manage all entries"
  on entries for all
  using (current_app_user_role() in ('Editor', 'Chief Editor'));

-- ============================================================
-- FOOTNOTES / MARGIN NOTES / REVISIONS / REPRESENTATIONS (follow entry)
-- ============================================================
create policy "Footnotes follow entry visibility"
  on footnotes for select
  using (
    entry_id in (
      select id from entries
      where (status = 'Published' and visibility = 'Public')
         or author_id = current_app_user_id()
         or current_app_user_role() in ('Editor', 'Chief Editor')
    )
  );

create policy "Authors manage own entry footnotes"
  on footnotes for all
  using (entry_id in (select id from entries where author_id = current_app_user_id()));

create policy "Margin notes follow entry visibility"
  on margin_notes for select
  using (
    entry_id in (
      select id from entries
      where (status = 'Published' and visibility = 'Public')
         or author_id = current_app_user_id()
         or current_app_user_role() in ('Editor', 'Chief Editor')
    )
  );

create policy "Authors manage own margin notes"
  on margin_notes for all
  using (entry_id in (select id from entries where author_id = current_app_user_id()));

create policy "Revisions readable by author and editors"
  on revisions for select
  using (
    entry_id in (
      select id from entries
      where author_id = current_app_user_id()
         or current_app_user_role() in ('Editor', 'Chief Editor')
    )
  );

create policy "Authors manage own revisions"
  on revisions for all
  using (entry_id in (select id from entries where author_id = current_app_user_id()));

create policy "Published representations follow entry visibility"
  on published_representations for select
  using (
    entry_id in (
      select id from entries
      where (status = 'Published' and visibility = 'Public')
         or author_id = current_app_user_id()
         or current_app_user_role() in ('Editor', 'Chief Editor')
    )
  );

create policy "Authors manage own representations"
  on published_representations for all
  using (entry_id in (select id from entries where author_id = current_app_user_id()));

-- ============================================================
-- CITATIONS / ENTRY_CITATIONS (public reference library)
-- ============================================================
create policy "Citations are publicly readable"
  on citations for select using (true);

create policy "Authenticated users manage citations"
  on citations for all using (auth.uid() is not null);

create policy "Entry citations follow entry visibility"
  on entry_citations for select
  using (
    entry_id in (
      select id from entries
      where (status = 'Published' and visibility = 'Public')
         or author_id = current_app_user_id()
         or current_app_user_role() in ('Editor', 'Chief Editor')
    )
  );

create policy "Authors manage own entry citations"
  on entry_citations for all
  using (entry_id in (select id from entries where author_id = current_app_user_id()));

-- ============================================================
-- SYSTEM LOGS (Editorial audit trail — Editor/Chief Editor only)
-- ============================================================
create policy "Editors can read system logs"
  on system_logs for select
  using (current_app_user_role() in ('Editor', 'Chief Editor'));

create policy "System logs are insert-only by authenticated users"
  on system_logs for insert
  with check (auth.uid() is not null);

-- ============================================================
-- POLICY DOCUMENTS / SECTIONS (publicly readable, Chief Editor manages)
-- ============================================================
create policy "Policy documents are publicly readable"
  on policy_documents for select using (true);

create policy "Chief Editor manages policy documents"
  on policy_documents for all
  using (current_app_user_role() = 'Chief Editor');

create policy "Policy sections are publicly readable"
  on policy_sections for select using (true);

create policy "Chief Editor manages policy sections"
  on policy_sections for all
  using (current_app_user_role() = 'Chief Editor');

-- ============================================================
-- RELEASE LOGS (publicly readable changelog)
-- ============================================================
create policy "Release logs are publicly readable"
  on release_logs for select using (true);

create policy "Chief Editor manages release logs"
  on release_logs for all
  using (current_app_user_role() = 'Chief Editor');

-- ============================================================
-- SYSTEM SETTINGS (publicly readable, Chief Editor manages)
-- ============================================================
create policy "System settings are publicly readable"
  on system_settings for select using (true);

create policy "Chief Editor manages system settings"
  on system_settings for all
  using (current_app_user_role() = 'Chief Editor');
