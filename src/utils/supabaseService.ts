import { supabase } from '../config/supabase';
import { User, WriterProfile, IdentityProfile, Entry, SystemSettings, PolicyDocument, SystemLog, LayoutSettings, EntryType } from '../types';

// ==========================================
// Row <-> App Model Mappers
// ==========================================
function rowToUser(row: any): User {
  return {
    id: row.id,
    authUserId: row.auth_user_id || undefined,
    username: row.username,
    email: row.email,
    role: row.role,
    penName: row.pen_name,
    signature: row.signature || '',
    avatarColor: row.avatar_color || '',
    bioSummary: row.bio_summary || '',
    suspended: !!row.suspended,
    affiliation: row.affiliation || '',
    createdAt: row.created_at,
    isAi: !!row.is_ai,
    subdomainApprovedEarly: !!row.subdomain_approved_early,
  };
}

function userToRow(user: User) {
  const row: Record<string, unknown> = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    pen_name: user.penName,
    signature: user.signature,
    avatar_color: user.avatarColor,
    bio_summary: user.bioSummary,
    suspended: !!user.suspended,
    affiliation: user.affiliation,
    is_ai: !!user.isAi,
    subdomain_approved_early: !!user.subdomainApprovedEarly,
  };
  // Only set auth_user_id when explicitly provided — omitting it on regular
  // saves must never clobber an existing link (see saveUser's upsert below).
  if (user.authUserId) {
    row.auth_user_id = user.authUserId;
  }
  return row;
}

function rowToProfile(row: any): WriterProfile {
  return {
    authorId: row.author_id,
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
  };
}

function profileToRow(profile: WriterProfile) {
  return {
    author_id: profile.authorId,
    hero_title: profile.heroTitle,
    hero_subtitle: profile.heroSubtitle,
  };
}

function rowToIdentity(row: any, bioItems: any[] = [], signatures: any[] = []): IdentityProfile {
  return {
    identityId: row.id,
    accountId: row.account_id,
    username: row.username,
    displayName: row.display_name || '',
    penName: row.pen_name || '',
    biography: row.biography || '',
    publicVisibility: row.public_visibility || 'Public',
    affiliation: row.affiliation || '',
    interests: row.interests || [],
    preferredLanguages: row.preferred_languages || [],
    preferredEdition: row.preferred_edition || '',
    lifeTimeline: bioItems.map(b => ({
      id: b.id,
      year: b.year,
      title: b.title,
      description: b.description,
      category: b.category,
    })),
    signatures: signatures.map(s => ({
      id: s.id,
      label: s.label,
      status: s.status,
      type: s.type,
      typedText: s.typed_text,
      fontFamily: s.font_family,
      strokes: s.strokes,
      penStyle: s.pen_style,
      typographyStyle: s.typography_style,
      createdAt: s.created_at,
    })),
  };
}

function rowToEntry(row: any, footnotes: any[] = [], marginNotes: any[] = []): Entry {
  return {
    id: row.id,
    authorId: row.author_id,
    publicationClass: row.publication_class,
    publisher: row.publisher,
    contentType: row.content_type,
    status: row.status,
    visibility: row.visibility,
    createdDate: row.created_date,
    updatedDate: row.updated_date,
    publishedDate: row.published_date,
    title: row.title || '',
    subtitle: row.subtitle,
    slug: row.slug,
    canonicalUrl: row.canonical_url || '',
    serialNo: row.serial_no ?? undefined,
    currentVersion: row.current_version ?? undefined,
    readingTimeMinutes: row.reading_time_minutes ?? undefined,
    content: row.content || '',
    excerpt: row.excerpt,
    featuredImage: row.featured_image,
    tags: row.tags || [],
    language: row.language,
    primaryScript: row.primary_script,
    direction: row.direction,
    layoutVariant: row.layout_variant,
    referenceSortOrder: row.reference_sort_order,
    referenceStyle: row.reference_style,
    signatureVersionId: row.signature_version_id,
    priority: row.priority,
    effectiveFrom: row.effective_from,
    effectiveUntil: row.effective_until,
    isPinned: !!row.is_pinned,
    editorialCategory: row.editorial_category,
    isInstitutional: !!row.is_institutional,
    discipline: row.discipline,
    underReview: !!row.under_review,
    footnotesData: footnotes.map(f => ({ id: f.id, content: f.content, label: f.label })),
    footnotes: footnotes.map(f => f.content),
    marginNotesData: marginNotes.reduce((acc, m) => ({ ...acc, [m.block_key]: m.content }), {}),
  };
}

function entryToRow(entry: Entry) {
  // Deliberately omits serial_no / current_version / reading_time_minutes —
  // those are authoritative DB-trigger-computed columns (SPEC-028 §14.1);
  // the client must never write to them.
  return {
    id: entry.id,
    author_id: entry.authorId,
    publication_class: entry.publicationClass,
    publisher: entry.publisher,
    content_type: entry.contentType,
    status: entry.status,
    visibility: entry.visibility,
    title: entry.title,
    subtitle: entry.subtitle,
    slug: entry.slug,
    canonical_url: entry.canonicalUrl,
    content: entry.content,
    excerpt: entry.excerpt,
    featured_image: entry.featuredImage,
    tags: entry.tags || [],
    language: entry.language,
    primary_script: entry.primaryScript,
    direction: entry.direction,
    layout_variant: entry.layoutVariant,
    reference_sort_order: entry.referenceSortOrder,
    reference_style: entry.referenceStyle,
    signature_version_id: entry.signatureVersionId,
    priority: entry.priority,
    effective_from: entry.effectiveFrom,
    effective_until: entry.effectiveUntil,
    is_pinned: !!entry.isPinned,
    editorial_category: entry.editorialCategory,
    is_institutional: !!entry.isInstitutional,
    discipline: entry.discipline,
    under_review: !!entry.underReview,
    created_date: entry.createdDate,
    updated_date: entry.updatedDate,
    published_date: entry.publishedDate,
  };
}

function rowToSystemSettings(row: any): SystemSettings {
  if (!row) {
    return {
      academicAffiliation: '',
      editorialPolicy: '',
      accentColor: '',
      allowSelfRegistration: true,
    };
  }
  return {
    academicAffiliation: row.academic_affiliation || '',
    editorialPolicy: row.editorial_policy || '',
    accentColor: row.accent_color || '',
    allowSelfRegistration: row.allow_self_registration ?? true,
    featuredScholarId: row.featured_scholar_id,
    featuredEntryId: row.featured_entry_id,
    featuredEssayIds: row.featured_essay_ids || [],
    featuredNoteIds: row.featured_note_ids || [],
    editorialSelectionIds: row.editorial_selection_ids || [],
    announcementBanner: row.announcement_banner,
    enableArabicAccent: !!row.enable_arabic_accent,
    layoutDensity: row.layout_density,
    allowedSignatureFonts: row.allowed_signature_fonts || [],
    rolePermissions: row.role_permissions,
    inTheNewsGoogleDocUrl: row.in_the_news_google_doc_url,
    worldClockHolidaysGoogleDocUrl: row.world_clock_holidays_google_doc_url,
    researchFindingsGoogleDocUrl: row.research_findings_google_doc_url,
    googleDocSyncTimes: row.google_doc_sync_times,
    inTheNewsCachedText: row.in_the_news_cached_text,
    inTheNewsLastFetched: row.in_the_news_last_fetched,
    worldClockCachedText: row.world_clock_cached_text,
    worldClockLastFetched: row.world_clock_last_fetched,
    researchFindingsCachedText: row.research_findings_cached_text,
    researchFindingsLastFetched: row.research_findings_last_fetched,
  };
}

function systemSettingsToRow(settings: SystemSettings) {
  return {
    id: 1,
    academic_affiliation: settings.academicAffiliation,
    editorial_policy: settings.editorialPolicy,
    accent_color: settings.accentColor,
    allow_self_registration: settings.allowSelfRegistration,
    featured_scholar_id: settings.featuredScholarId || null,
    featured_entry_id: settings.featuredEntryId || null,
    featured_essay_ids: settings.featuredEssayIds || [],
    featured_note_ids: settings.featuredNoteIds || [],
    editorial_selection_ids: settings.editorialSelectionIds || [],
    announcement_banner: settings.announcementBanner,
    enable_arabic_accent: !!settings.enableArabicAccent,
    layout_density: settings.layoutDensity,
    allowed_signature_fonts: settings.allowedSignatureFonts || [],
    role_permissions: settings.rolePermissions,
    in_the_news_google_doc_url: settings.inTheNewsGoogleDocUrl,
    world_clock_holidays_google_doc_url: settings.worldClockHolidaysGoogleDocUrl,
    research_findings_google_doc_url: settings.researchFindingsGoogleDocUrl,
    google_doc_sync_times: settings.googleDocSyncTimes,
    in_the_news_cached_text: settings.inTheNewsCachedText,
    in_the_news_last_fetched: settings.inTheNewsLastFetched,
    world_clock_cached_text: settings.worldClockCachedText,
    world_clock_last_fetched: settings.worldClockLastFetched,
    research_findings_cached_text: settings.researchFindingsCachedText,
    research_findings_last_fetched: settings.researchFindingsLastFetched,
  };
}

function rowToLayoutSettings(row: any): LayoutSettings {
  return {
    contentType: row.content_type,
    alignment: row.alignment,
    columnWidth: row.column_width,
    marginNoteWidth: row.margin_note_width,
    padding: row.padding,
    spacingBefore: row.spacing_before,
    spacingAfter: row.spacing_after,
    lineHeight: Number(row.line_height),
  };
}

function layoutSettingsToRow(settings: LayoutSettings) {
  return {
    content_type: settings.contentType,
    alignment: settings.alignment,
    column_width: settings.columnWidth,
    margin_note_width: settings.marginNoteWidth,
    padding: settings.padding,
    spacing_before: settings.spacingBefore,
    spacing_after: settings.spacingAfter,
    line_height: settings.lineHeight,
  };
}

function rowToPolicy(row: any): PolicyDocument {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    lastUpdated: row.last_updated,
    sections: (row.policy_sections || [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((s: any) => ({ id: s.id, title: s.title, content: s.content })),
  };
}

function rowToLog(row: any, users: User[]): SystemLog {
  const operator = users.find(u => u.id === row.operator_id);
  return {
    id: row.id,
    timestamp: row.timestamp,
    operator: operator?.penName || 'Unknown',
    role: row.role || '',
    action: row.action,
  };
}

// ==========================================
// Service
// ==========================================
export const supabaseService = {
  async fetchDbState() {
    const [usersRes, profilesRes, identitiesRes, entriesRes, settingsRes, policiesRes, logsRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('identities').select('*, biography_items(*), digital_signatures(*)'),
      supabase.from('entries').select('*, footnotes(*), margin_notes(*)'),
      supabase.from('system_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('policy_documents').select('*, policy_sections(*)'),
      supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(200),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (profilesRes.error) throw profilesRes.error;
    if (identitiesRes.error) throw identitiesRes.error;
    if (entriesRes.error) throw entriesRes.error;

    const users = (usersRes.data || []).map(rowToUser);

    return {
      users,
      profiles: (profilesRes.data || []).map(rowToProfile),
      identities: (identitiesRes.data || []).map((row: any) =>
        rowToIdentity(row, row.biography_items, row.digital_signatures)
      ),
      entries: (entriesRes.data || []).map((row: any) =>
        rowToEntry(row, row.footnotes, row.margin_notes)
      ),
      systemSettings: rowToSystemSettings(settingsRes.data),
      policies: (policiesRes.data || []).map(rowToPolicy),
      logs: (logsRes.data || []).map((row: any) => rowToLog(row, users)),
    };
  },

  async saveUser(user: User) {
    const { error } = await supabase.from('users').upsert(userToRow(user));
    if (error) throw error;
  },

  async saveProfile(profile: WriterProfile) {
    const { error } = await supabase.from('profiles').upsert(profileToRow(profile));
    if (error) throw error;
  },

  async saveIdentity(identity: IdentityProfile) {
    const identityRow = {
      account_id: identity.accountId,
      username: identity.username,
      display_name: identity.displayName,
      pen_name: identity.penName,
      biography: identity.biography,
      public_visibility: identity.publicVisibility,
      affiliation: identity.affiliation,
      interests: identity.interests || [],
      preferred_languages: identity.preferredLanguages || [],
      preferred_edition: identity.preferredEdition || null,
    };
    const { data, error } = await supabase
      .from('identities')
      .upsert(identityRow, { onConflict: 'account_id' })
      .select('id')
      .single();
    if (error) throw error;
    const identityId = data.id;

    await supabase.from('digital_signatures').delete().eq('identity_id', identityId);
    if (identity.signatures.length > 0) {
      // Carry each signature's own id/createdAt through the delete+reinsert —
      // without them, every identity save (even an unrelated one, like
      // editing a biography milestone) silently rotated the signature's id
      // and reset its created-at to now, corrupting "Created on" display and
      // any future reference to a specific signature version.
      const { error: sigError } = await supabase.from('digital_signatures').insert(
        identity.signatures.map(s => ({
          id: s.id,
          identity_id: identityId,
          label: s.label,
          status: s.status,
          type: s.type,
          typed_text: s.typedText,
          font_family: s.fontFamily,
          strokes: s.strokes,
          pen_style: s.penStyle,
          typography_style: s.typographyStyle,
          created_at: s.createdAt,
        }))
      );
      if (sigError) throw sigError;
    }

    await supabase.from('biography_items').delete().eq('identity_id', identityId);
    if (identity.lifeTimeline.length > 0) {
      const { error: bioError } = await supabase.from('biography_items').insert(
        identity.lifeTimeline.map((b, idx) => ({
          identity_id: identityId,
          year: b.year,
          title: b.title,
          description: b.description,
          category: b.category,
          sort_order: idx,
        }))
      );
      if (bioError) throw bioError;
    }
  },

  async saveEntry(entry: Entry) {
    const { error } = await supabase.from('entries').upsert(entryToRow(entry));
    if (error) throw error;

    if (entry.footnotesData) {
      const { error: fnDeleteError } = await supabase.from('footnotes').delete().eq('entry_id', entry.id);
      if (fnDeleteError) throw fnDeleteError;
      if (entry.footnotesData.length > 0) {
        const { error: fnInsertError } = await supabase.from('footnotes').insert(
          entry.footnotesData.map((f, idx) => ({
            entry_id: entry.id,
            label: f.label,
            content: f.content,
            sort_order: idx,
          }))
        );
        if (fnInsertError) throw fnInsertError;
      }
    }

    if (entry.marginNotesData) {
      const { error: mnDeleteError } = await supabase.from('margin_notes').delete().eq('entry_id', entry.id);
      if (mnDeleteError) throw mnDeleteError;
      const keys = Object.keys(entry.marginNotesData);
      if (keys.length > 0) {
        const { error: mnInsertError } = await supabase.from('margin_notes').insert(
          keys.map(key => ({
            entry_id: entry.id,
            block_key: key,
            content: entry.marginNotesData![key],
          }))
        );
        if (mnInsertError) throw mnInsertError;
      }
    }
  },

  async deleteEntry(entryId: string) {
    const { error } = await supabase.from('entries').delete().eq('id', entryId);
    if (error) throw error;
  },

  async saveSystemSettings(settings: SystemSettings) {
    const { error } = await supabase.from('system_settings').upsert(systemSettingsToRow(settings));
    if (error) throw error;
  },

  // Returns null if no override is stored yet (or the table/migration doesn't
  // exist yet) — callers fall back to the hardcoded src/presentation/*.ts spec.
  async fetchLayoutSettings(contentType: EntryType): Promise<LayoutSettings | null> {
    const { data, error } = await supabase
      .from('layout_settings')
      .select('*')
      .eq('content_type', contentType)
      .maybeSingle();
    if (error) {
      console.warn('[layout_settings] fetch failed (migration likely not run yet):', error.message);
      return null;
    }
    return data ? rowToLayoutSettings(data) : null;
  },

  async saveLayoutSettings(settings: LayoutSettings) {
    const { error } = await supabase.from('layout_settings').upsert(layoutSettingsToRow(settings));
    if (error) throw error;
  },

  async logAction(action: string, operator: User) {
    const { error } = await supabase.from('system_logs').insert({
      operator_id: operator.id,
      role: operator.role,
      action,
    });
    if (error) throw error;
  },

  async savePolicy(policy: PolicyDocument) {
    const { error } = await supabase.from('policy_documents').upsert({
      id: policy.id,
      type: policy.type,
      title: policy.title,
      last_updated: new Date().toISOString(),
    });
    if (error) throw error;

    await supabase.from('policy_sections').delete().eq('policy_id', policy.id);
    if (policy.sections.length > 0) {
      const { error: sectionsError } = await supabase.from('policy_sections').insert(
        policy.sections.map((s, idx) => ({
          policy_id: policy.id,
          title: s.title,
          content: s.content,
          sort_order: idx,
        }))
      );
      if (sectionsError) throw sectionsError;
    }
  },
};
