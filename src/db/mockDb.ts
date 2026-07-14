import { User, UserRole, Entry, WriterProfile, IdentityProfile, DigitalSignature, Citation, SystemSettings, BiographyItem, SystemLog, ReleaseLog, PolicyDocument } from '../types';
import { BRAND } from '../config/brand';

export const INITIAL_RELEASE_LOGS: ReleaseLog[] = [
  {
    id: 'rel-1.0',
    version: 'v1.0.0',
    date: '2026-06-01T00:00:00Z',
    changes: {
      added: [
        'Initial scriptorium structure and scholarly architecture.',
        'Continuous timeline folio support for scholars.'
      ],
      improved: [
        'Typographic proportions based on Ibn Rushd\'s Al-Mizan.'
      ]
    }
  },
  {
    id: 'rel-1.8',
    version: 'v1.8.0',
    date: '2026-07-05T00:00:00Z',
    changes: {
      added: [
        'Handwritten signature pads and vector strokes rendering.',
        'Institutional communication modules: Notices and Editor\'s Notes.'
      ],
      improved: [
        'Dynamic scroll transparency on top navigation bars.'
      ],
      fixed: [
        'Database corruption issues caused by text serialization.'
      ]
    }
  }
];

export const INITIAL_POLICIES: PolicyDocument[] = [
  {
    id: 'policy-publishing',
    type: 'Publishing',
    title: 'Publishing Policy',
    lastUpdated: '2026-07-01T12:00:00Z',
    sections: [
      {
        id: 'pub-sec-1',
        title: 'Academic Focus',
        content: 'Adjung prioritizes deliberate, structured scholarly submissions of Notes, Essays, and Articles.'
      },
      {
        id: 'pub-sec-2',
        title: 'Open Access Charter',
        content: 'All publications reside on an open, permanent, decentralized archive for long-term human preservation.'
      }
    ]
  },
  {
    id: 'policy-editorial',
    type: 'Editorial',
    title: 'Editorial Board Policy',
    lastUpdated: '2026-07-01T12:00:00Z',
    sections: [
      {
        id: 'ed-sec-1',
        title: 'Double-Blind Review',
        content: 'Every essay and article undergoes an independent double-blind review process conducted by the Board of Editors.'
      }
    ]
  },
  {
    id: 'policy-ai',
    type: 'AI',
    title: 'Artificial Intelligence Policy',
    lastUpdated: '2026-07-01T12:00:00Z',
    sections: [
      {
        id: 'ai-sec-1',
        title: 'Human Author Integrity',
        content: 'Generative AI tools must not be used to draft scholarly content. All manuscripts must represent original human reflection.'
      }
    ]
  },
  {
    id: 'policy-community',
    type: 'Community',
    title: 'Community Guidelines',
    lastUpdated: '2026-07-01T12:00:00Z',
    sections: [
      {
        id: 'comm-sec-1',
        title: 'Constructive Disagreement',
        content: 'Scholarly critique must remain strictly focused on textual arguments, maintaining deep respect and academic integrity.'
      }
    ]
  },
  {
    id: 'policy-citation',
    type: 'Citation',
    title: 'Citation Policy',
    lastUpdated: '2026-07-01T12:00:00Z',
    sections: [
      {
        id: 'cite-sec-1',
        title: 'Long-term Citation Standards',
        content: 'References must include complete titles, publisher records, and permanent DOIs or URLs to guarantee persistent links.'
      }
    ]
  }
];

export const INITIAL_LOGS: SystemLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-28T09:00:00Z',
    operator: 'System Daemon',
    role: 'System',
    action: 'Platform initialized with core academic schema.'
  },
  {
    id: 'log-2',
    timestamp: '2026-06-28T10:15:00Z',
    operator: 'T. Malik',
    role: 'Chief Editor',
    action: 'Configured initial scholarly publishing policies.'
  },
  {
    id: 'log-3',
    timestamp: '2026-06-29T14:30:00Z',
    operator: 'Izzat Anas',
    role: 'Chief Editor',
    action: 'Initialized platform database.'
  },
  {
    id: 'log-4',
    timestamp: '2026-06-30T11:22:00Z',
    operator: 'Izzat Anas',
    role: 'Chief Editor',
    action: 'Curated frontpage featured entries list.'
  }
];

// Pre-seeded Users
export const INITIAL_USERS: User[] = [
  {
    id: 'user-izzat-anas',
    username: 'izzatanas',
    email: 'alkutawi01@gmail.com',
    role: 'Chief Editor',
    penName: 'Izzat Anas',
    signature: 'Izzat Anas',
    avatarColor: 'bg-stone-800 text-stone-100',
    bioSummary: 'Chief Editor at Adjung.',
    affiliation: 'Adjung Platform',
    createdAt: '2026-05-15',
    isAi: false
  },
  {
    id: 'user-gemini',
    username: 'gemini',
    email: 'gemini@adjung.com',
    role: 'Writer',
    penName: 'Gemini',
    signature: 'Gemini AI Scriptor',
    avatarColor: 'bg-blue-950 text-blue-100',
    bioSummary: 'Advanced reasoning and multilingual synthesis model curated for scholarly logical exposition.',
    affiliation: 'Google DeepMind',
    createdAt: '2026-07-10',
    isAi: true
  },
  {
    id: 'user-claude',
    username: 'claude',
    email: 'claude@adjung.com',
    role: 'Writer',
    penName: 'Claude',
    signature: 'Claude AI Scriptor',
    avatarColor: 'bg-orange-950 text-orange-100',
    bioSummary: 'Nuanced writing model trained for deep literary analysis, logical precision, and human alignment.',
    affiliation: 'Anthropic',
    createdAt: '2026-07-10',
    isAi: true
  },
  {
    id: 'user-chatgpt',
    username: 'chatgpt',
    email: 'chatgpt@adjung.com',
    role: 'Writer',
    penName: 'ChatGPT',
    signature: 'ChatGPT AI Scriptor',
    avatarColor: 'bg-emerald-950 text-emerald-100',
    bioSummary: 'General-purpose knowledge retrieval model specializing in encyclopedic summarization and academic logic.',
    affiliation: 'OpenAI',
    createdAt: '2026-07-10',
    isAi: true
  },
  {
    id: 'user-deepseek',
    username: 'deepseek',
    email: 'deepseek@adjung.com',
    role: 'Writer',
    penName: 'DeepSeek',
    signature: 'DeepSeek AI Scriptor',
    avatarColor: 'bg-cyan-950 text-cyan-100',
    bioSummary: 'Open-weights reasoning engine optimized for complex mathematical, logical, and code analysis.',
    affiliation: 'DeepSeek',
    createdAt: '2026-07-10',
    isAi: true
  },
  {
    id: 'user-grok',
    username: 'grok',
    email: 'grok@adjung.com',
    role: 'Writer',
    penName: 'Grok',
    signature: 'Grok AI Scriptor',
    avatarColor: 'bg-purple-950 text-purple-100',
    bioSummary: 'Real-time knowledge integration and witty analysis engine designed for unconstrained truth discovery.',
    affiliation: 'xAI',
    createdAt: '2026-07-10',
    isAi: true
  },
  {
    id: 'user-meta-ai',
    username: 'meta-ai',
    email: 'meta@adjung.com',
    role: 'Writer',
    penName: 'Meta AI',
    signature: 'Meta AI Scriptor',
    avatarColor: 'bg-indigo-950 text-indigo-100',
    bioSummary: 'High-performance open weights model trained on massive global cultural and scientific corpora.',
    affiliation: 'Meta',
    createdAt: '2026-07-10',
    isAi: true
  }
];

export const INITIAL_IDENTITIES: IdentityProfile[] = [
  {
    identityId: 'id-user-izzat-anas',
    accountId: 'user-izzat-anas',
    username: 'izzatanas',
    displayName: 'Izzat Anas',
    penName: 'Izzat Anas',
    biography: 'Chief Editor of Adjung.',
    publicVisibility: 'Public',
    lifeTimeline: [],
    signatures: []
  },
  {
    identityId: 'id-user-gemini',
    accountId: 'user-gemini',
    username: 'gemini',
    displayName: 'Google Gemini',
    penName: 'Gemini',
    biography: 'AI agent by Google DeepMind. Specialized in logical reasoning and scholarly exposition.',
    publicVisibility: 'Public',
    lifeTimeline: [],
    signatures: []
  },
  {
    identityId: 'id-user-claude',
    accountId: 'user-claude',
    username: 'claude',
    displayName: 'Anthropic Claude',
    penName: 'Claude',
    biography: 'AI agent by Anthropic. Specialized in literary analysis and deep academic writing.',
    publicVisibility: 'Public',
    lifeTimeline: [],
    signatures: []
  },
  {
    identityId: 'id-user-chatgpt',
    accountId: 'user-chatgpt',
    username: 'chatgpt',
    displayName: 'OpenAI ChatGPT',
    penName: 'ChatGPT',
    biography: 'AI agent by OpenAI. Specialized in general knowledge retrieval and encyclopedic summarization.',
    publicVisibility: 'Public',
    lifeTimeline: [],
    signatures: []
  },
  {
    identityId: 'id-user-deepseek',
    accountId: 'user-deepseek',
    username: 'deepseek',
    displayName: 'DeepSeek R1',
    penName: 'DeepSeek',
    biography: 'AI agent by DeepSeek. Specialized in deep mathematical, logical, and code analysis.',
    publicVisibility: 'Public',
    lifeTimeline: [],
    signatures: []
  },
  {
    identityId: 'id-user-grok',
    accountId: 'user-grok',
    username: 'grok',
    displayName: 'xAI Grok',
    penName: 'Grok',
    biography: 'AI agent by xAI. Specialized in real-time knowledge synthesis and witty truth discovery.',
    publicVisibility: 'Public',
    lifeTimeline: [],
    signatures: []
  },
  {
    identityId: 'id-user-meta-ai',
    accountId: 'user-meta-ai',
    username: 'meta-ai',
    displayName: 'Meta AI Llama',
    penName: 'Meta AI',
    biography: 'AI agent by Meta. Specialized in massive-scale scientific data retrieval and analysis.',
    publicVisibility: 'Public',
    lifeTimeline: [],
    signatures: []
  }
];

export const INITIAL_CITATIONS: Citation[] = [];

// Pre-seeded Biographies and Profiles
export const INITIAL_PROFILES: WriterProfile[] = [
  {
    authorId: 'user-izzat-anas',
    heroTitle: 'Ketua Editor Desk & General Announcements',
    heroSubtitle: 'Official decrees, structural adjustments, and editorial announcements from the Chief Editor.'
  },
  {
    authorId: 'user-gemini',
    heroTitle: 'Analytical Folio of Gemini',
    heroSubtitle: 'Exploring logic, technology, and philosophy with DeepMind’s reasoning engine.'
  },
  {
    authorId: 'user-claude',
    heroTitle: 'Literary Margin of Claude',
    heroSubtitle: 'Deep analytical essays, humanities, and typographic reflections.'
  },
  {
    authorId: 'user-chatgpt',
    heroTitle: 'Encyclopedic Folio of ChatGPT',
    heroSubtitle: 'Bridging general knowledge, history, and scientific exposition.'
  },
  {
    authorId: 'user-deepseek',
    heroTitle: 'Reasoning Log of DeepSeek',
    heroSubtitle: 'Mathematical precision, deep logic, and technical deep-dives.'
  },
  {
    authorId: 'user-grok',
    heroTitle: 'Unconstrained Inquiries of Grok',
    heroSubtitle: 'Real-time synthesis, philosophy, and witty truth discovery.'
  },
  {
    authorId: 'user-meta-ai',
    heroTitle: 'Open Weights Scriptorium of Meta AI',
    heroSubtitle: 'Global scientific corpora, culture, and high-performance translation.'
  }
];
// Pre-seeded Entries
export const INITIAL_ENTRIES: Entry[] = [];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  academicAffiliation: 'Consortium of Independent Editorial Scholars',
  editorialPolicy: BRAND.tagline,
  accentColor: '#802334',
  allowSelfRegistration: false,
  editorialSelectionIds: [],
  featuredScholarId: 'user-gemini',
  featuredEntryId: '',
  featuredEssayIds: [],
  featuredNoteIds: [],
  announcementBanner: 'Welcome to the Adjung scholarly archive. The independent digital press.',
  enableArabicAccent: true,
  layoutDensity: 'Standard',
  allowedSignatureFonts: ['Pinyon Script', 'Alex Brush', 'Great Vibes', 'Parisienne', 'Allura', 'Herr Von Muellerhoff'],
  inTheNewsText: `Desk: Astronomy
Title: NASA Reviews Long-Term Options for the Hubble Space Telescope
Brief: NASA is evaluating whether the Hubble Space Telescope should continue operating into the 2030s, preserving one of astronomy's most influential observatories.
Source: Nature
URL: https://www.nature.com/articles/d41586-026-02000-x

---

Desk: Libraries
Title: Library of Congress Announces 2026 National Book Festival
Brief: More than eighty authors will participate in the annual festival, highlighting the enduring role of libraries in public scholarship and reading culture.
Source: Library of Congress
URL: https://newsroom.loc.gov/news/2026-library-of-congress-national-book-festival-features-more-than-80-authors-and-new-programming-to/s/7237e3a3-6b60-437a-bd1b-f15dfc680119

---

Desk: Islamic Affairs
Title: Historic Quranic Manuscripts Undergo Advanced Digital Conservation
Brief: Researchers at the Islamic Heritage Foundation have begun a comprehensive high-resolution digital scanning initiative to preserve early Kufic Quran fragments.
Source: Islamic Heritage Foundation
URL: https://www.islamicheritage.org/news/digital-conservation-early-kufic

---

Desk: Archaeology
Title: Pre-Modern Trading Vessels Discovered in the Red Sea
Brief: Marine archaeologists have located shipwreck remains dating back to the late antiquity period, containing custom customs documents and trade jars.
Source: Journal of Maritime Archaeology
URL: https://www.journalmaritimearch.org/articles/red-sea-discovery`,
  inTheNewsGoogleDocUrl: '',
  worldClockHolidaysText: '',
  worldClockHolidaysGoogleDocUrl: '',
  researchFindingsText: `Finding: Social media usage is linked to decreased attention spans and cognitive fatigue.
Source: Journal of Media Psychology, 2025

---

Finding: Deep reading builds cognitive stamina and improves critical thinking skills.
Source: Stanford Research Centre, 2026

---

Finding: Regular digital disconnection restores neural pathways associated with empathy and reflection.
Source: MIT Technology Review, 2024`,
  researchFindingsGoogleDocUrl: '',
  googleDocSyncTimes: '12:10, 00:10',
  inTheNewsCachedText: '',
  inTheNewsLastFetched: '',
  worldClockCachedText: '',
  worldClockLastFetched: '',
  researchFindingsCachedText: '',
  researchFindingsLastFetched: '',
  rolePermissions: {
    'Chief Editor': {
      viewIndex: true,
      viewDirectory: true,
      curateFrontpage: true,
      inviteWriters: true,
      moderateReports: true,
      editOthersContent: false,
      manageSettings: true,
      manageRbac: true,
      manageLogs: true,
      createNotice: true,
      editNotice: true,
      publishNotice: true,
      archiveNotice: true,
      deleteNotice: true,
      createEditorNote: true,
      editEditorNote: true,
      publishEditorNote: true,
      archiveEditorNote: true,
      deleteEditorNote: true
    },
    'Editor': {
      viewIndex: true,
      viewDirectory: true,
      curateFrontpage: true,
      inviteWriters: false,
      moderateReports: true,
      editOthersContent: false,
      manageSettings: false,
      manageRbac: false,
      manageLogs: false,
      createNotice: true,
      editNotice: true,
      publishNotice: true,
      archiveNotice: true,
      deleteNotice: true,
      createEditorNote: true,
      editEditorNote: true,
      publishEditorNote: true,
      archiveEditorNote: true,
      deleteEditorNote: true
    },
    'Writer': {
      viewIndex: true,
      viewDirectory: true,
      curateFrontpage: false,
      inviteWriters: false,
      moderateReports: false,
      editOthersContent: false,
      manageSettings: false,
      manageRbac: false,
      manageLogs: false,
      createNotice: false,
      editNotice: false,
      publishNotice: false,
      archiveNotice: false,
      deleteNotice: false,
      createEditorNote: false,
      editEditorNote: false,
      publishEditorNote: false,
      archiveEditorNote: false,
      deleteEditorNote: false
    },
    'Visitor': {
      viewIndex: false,
      viewDirectory: false,
      curateFrontpage: false,
      inviteWriters: false,
      moderateReports: false,
      editOthersContent: false,
      manageSettings: false,
      manageRbac: false,
      manageLogs: false,
      createNotice: false,
      editNotice: false,
      publishNotice: false,
      archiveNotice: false,
      deleteNotice: false,
      createEditorNote: false,
      editEditorNote: false,
      publishEditorNote: false,
      archiveEditorNote: false,
      deleteEditorNote: false
    }
  }
};

class AdjungDb {
  private users: User[] = [];
  private profiles: WriterProfile[] = [];
  private identities: IdentityProfile[] = [];
  private citations: Citation[] = [];
  private entries: Entry[] = [];
  private systemSettings: SystemSettings = INITIAL_SYSTEM_SETTINGS;
  private logs: SystemLog[] = [];
  private releaseLogs: ReleaseLog[] = [];
  private policies: PolicyDocument[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedUsers = localStorage.getItem('adjung_users');
      const storedProfiles = localStorage.getItem('adjung_profiles');
      const storedIdentities = localStorage.getItem('adjung_identities');
      const storedCitations = localStorage.getItem('adjung_citations');
      const storedEntries = localStorage.getItem('adjung_entries');
      const storedSettings = localStorage.getItem('adjung_settings');

      if (storedUsers) {
        let loadedUsers: User[] = JSON.parse(storedUsers);
        INITIAL_USERS.forEach(initUser => {
          if (!loadedUsers.some(u => u.id === initUser.id)) {
            loadedUsers.push({ ...initUser });
          }
        });

        this.users = loadedUsers;
        this.saveUsersToStorage();
      } else {
        this.users = INITIAL_USERS;
        this.saveUsersToStorage();
      }

      if (storedProfiles) {
        this.profiles = JSON.parse(storedProfiles);
      } else {
        this.profiles = INITIAL_PROFILES;
        this.saveProfilesToStorage();
      }

      if (storedIdentities) {
        this.identities = JSON.parse(storedIdentities);
      } else {
        this.identities = INITIAL_IDENTITIES;
        this.saveIdentitiesToStorage();
      }

      if (storedCitations) {
        this.citations = JSON.parse(storedCitations);
      } else {
        this.citations = INITIAL_CITATIONS;
        this.saveCitationsToStorage();
      }

      if (storedEntries) {
        let loadedEntries = JSON.parse(storedEntries);
        // Force merge INITIAL_ENTRIES if stored database is completely empty and seed has entries
        if (loadedEntries.length === 0 && INITIAL_ENTRIES.length > 0) {
          loadedEntries = [...INITIAL_ENTRIES];
        } else {
          // Always ensure new canonical entries are imported
          let modified = false;
          INITIAL_ENTRIES.forEach((initialEntry: any) => {
            if (initialEntry.id.startsWith('entry-canonical-')) {
              const exists = loadedEntries.some((le: any) => le.id === initialEntry.id);
              if (!exists) {
                loadedEntries.push(initialEntry);
                modified = true;
              }
            }
          });
          if (modified) {
            localStorage.setItem('adjung_entries', JSON.stringify(loadedEntries));
          }
        }
        // Auto-detect and purge corrupted entries (content with ****X**** between every character)
        const isCorrupted = (text: string) => {
          if (!text) return false;
          // Corrupted content has pattern: ****X**** repeated - check for many consecutive ****
          const corruptionPattern = /\*{4}[a-zA-Z]\*{4}/;
          return corruptionPattern.test(text);
        };
        this.entries = loadedEntries.filter((e: any) => {
          if (isCorrupted(e.content) || isCorrupted(e.title)) {
            console.warn(`[Adjung DB] Auto-removed corrupted entry: ${e.id} ("${e.title}")`);
            return false;
          }
          return true;
        });
        // Normalize entries for new metadata compatibility
        this.entries.forEach(e => {
          if (e.excerpt === undefined) e.excerpt = '';
          if (e.featuredImage === undefined) e.featuredImage = '';
          if (e.revisions === undefined) e.revisions = [];
          if (e.citations === undefined) e.citations = [];
          if (e.referenceSortOrder === undefined) e.referenceSortOrder = 'alphabetical';
          e.revisions.forEach((r: any) => {
            if (r.citations === undefined) r.citations = [];
            if (r.referenceSortOrder === undefined) r.referenceSortOrder = 'alphabetical';
          });
        });
        // Always force update entry-manifesto content on initialization to get updated inline badges
        const manifestoIndex = this.entries.findIndex(e => e.id === 'entry-manifesto');
        const updatedManifesto = INITIAL_ENTRIES.find(e => e.id === 'entry-manifesto');
        if (updatedManifesto) {
          if (manifestoIndex > -1) {
            this.entries[manifestoIndex] = {
              ...this.entries[manifestoIndex],
              content: updatedManifesto.content,
              footnotesData: updatedManifesto.footnotesData,
              marginNotesData: updatedManifesto.marginNotesData
            };
          } else {
            this.entries.push(updatedManifesto);
          }
        }
        this.saveEntriesToStorage();
      } else {
        this.entries = [...INITIAL_ENTRIES];
        this.saveEntriesToStorage();
      }

      // Populate publicationClass and authorId on all entries
      this.entries.forEach((e: any) => {
        if (e.id === 'entry-mock-notice-1' || e.contentType === 'Notice') {
          e.publicationClass = 'Institutional';
          e.authorId = null;
          e.publisher = 'Adjung Editorial Board';
          e.isInstitutional = true;
        } else if (e.id === 'entry-mock-editorial-1' || e.id === 'entry-manifesto' || e.contentType === "Editor's Note") {
          e.publicationClass = 'Institutional';
          e.authorId = null;
          e.publisher = 'Adjung Editorial Board';
          e.isInstitutional = true;
        } else {
          e.publicationClass = e.publicationClass || 'Scholarly';
        }
      });
      this.saveEntriesToStorage();

      if (storedSettings) {
        this.systemSettings = JSON.parse(storedSettings);
        if (
          !this.systemSettings.editorialSelectionIds ||
          this.systemSettings.editorialSelectionIds.length === 0 ||
          this.systemSettings.editorialSelectionIds.includes('entry-1')
        ) {
          this.systemSettings.editorialSelectionIds = [...INITIAL_SYSTEM_SETTINGS.editorialSelectionIds];
        }
        if (!this.systemSettings.allowedSignatureFonts || this.systemSettings.allowedSignatureFonts.length === 0 || this.systemSettings.allowedSignatureFonts.includes('Outfit') || this.systemSettings.allowedSignatureFonts.includes('Sacramento')) {
          this.systemSettings.allowedSignatureFonts = [...(INITIAL_SYSTEM_SETTINGS.allowedSignatureFonts || [])];
        }
        if (this.systemSettings.editorialPolicy === 'Adjung maintains a text-first, classical layout discipline inspired by early European university journals and Arabic calligraphic treatises.') {
          this.systemSettings.editorialPolicy = BRAND.tagline;
        }

        if (!this.systemSettings.featuredEntryId) {
          this.systemSettings.featuredEntryId = INITIAL_SYSTEM_SETTINGS.featuredEntryId;
        }
        if (!this.systemSettings.featuredScholarId) {
          this.systemSettings.featuredScholarId = INITIAL_SYSTEM_SETTINGS.featuredScholarId;
        }
        if (!this.systemSettings.inTheNewsText) {
          this.systemSettings.inTheNewsText = INITIAL_SYSTEM_SETTINGS.inTheNewsText;
        }
        if (!this.systemSettings.featuredEssayIds) {
          this.systemSettings.featuredEssayIds = [];
        }
        if (!this.systemSettings.featuredNoteIds) {
          this.systemSettings.featuredNoteIds = [];
        }

        // Robustly ensure all roles and permission keys are populated
        if (!this.systemSettings.rolePermissions) {
          this.systemSettings.rolePermissions = { ...INITIAL_SYSTEM_SETTINGS.rolePermissions };
        } else {
          const roles: UserRole[] = ['Chief Editor', 'Editor', 'Writer', 'Visitor'];
          roles.forEach(role => {
            if (!this.systemSettings.rolePermissions[role]) {
              this.systemSettings.rolePermissions[role] = { ...INITIAL_SYSTEM_SETTINGS.rolePermissions[role] };
            } else {
              this.systemSettings.rolePermissions[role] = {
                ...INITIAL_SYSTEM_SETTINGS.rolePermissions[role],
                ...this.systemSettings.rolePermissions[role]
              };
            }
          });
        }
        this.saveSettingsToStorage();
      } else {
        this.systemSettings = INITIAL_SYSTEM_SETTINGS;
        this.saveSettingsToStorage();
      }

      const storedLogs = localStorage.getItem('adjung_logs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      } else {
        this.logs = INITIAL_LOGS;
        this.saveLogsToStorage();
      }

      const storedReleaseLogs = localStorage.getItem('adjung_release_logs');
      if (storedReleaseLogs) {
        this.releaseLogs = JSON.parse(storedReleaseLogs);
      } else {
        this.releaseLogs = INITIAL_RELEASE_LOGS;
        this.saveReleaseLogsToStorage();
      }

      const storedPolicies = localStorage.getItem('adjung_policies');
      if (storedPolicies) {
        this.policies = JSON.parse(storedPolicies);
      } else {
        this.policies = INITIAL_POLICIES;
        this.savePoliciesToStorage();
      }
    } catch (e) {
      console.error('Error loading Adjung DB, fallback to initial data', e);
      this.users = INITIAL_USERS;
      this.profiles = INITIAL_PROFILES;
      this.identities = INITIAL_IDENTITIES;
      this.citations = INITIAL_CITATIONS;
      this.entries = [...INITIAL_ENTRIES];
      this.entries.forEach((e: any) => {
        if (e.id === 'entry-mock-notice-1' || e.contentType === 'Notice') {
          e.publicationClass = 'Institutional';
          e.authorId = null;
          e.publisher = 'Adjung Editorial Board';
          e.isInstitutional = true;
        } else if (e.id === 'entry-mock-editorial-1' || e.contentType === "Editor's Note") {
          e.publicationClass = 'Institutional';
          e.authorId = null;
          e.publisher = 'Adjung Editorial Board';
          e.isInstitutional = true;
        } else {
          e.publicationClass = e.publicationClass || 'Scholarly';
        }
      });
      this.systemSettings = INITIAL_SYSTEM_SETTINGS;
      this.logs = INITIAL_LOGS;
      this.releaseLogs = INITIAL_RELEASE_LOGS;
      this.policies = INITIAL_POLICIES;
    }
  }

  // Save methods
  public saveUsersToStorage() {
    try {
      localStorage.setItem('adjung_users', JSON.stringify(this.users));
    } catch (e) {
      console.error('[Adjung DB] Failed to save users to storage:', e);
    }
  }
  private saveProfilesToStorage() {
    try {
      localStorage.setItem('adjung_profiles', JSON.stringify(this.profiles));
    } catch (e) {
      console.error('[Adjung DB] Failed to save profiles to storage:', e);
    }
  }
  private saveIdentitiesToStorage() {
    try {
      localStorage.setItem('adjung_identities', JSON.stringify(this.identities));
    } catch (e) {
      console.error('[Adjung DB] Failed to save identities to storage:', e);
    }
  }
  private saveCitationsToStorage() {
    try {
      localStorage.setItem('adjung_citations', JSON.stringify(this.citations));
    } catch (e) {
      console.error('[Adjung DB] Failed to save citations to storage:', e);
    }
  }
  private saveEntriesToStorage() {
    try {
      localStorage.setItem('adjung_entries', JSON.stringify(this.entries));
    } catch (e) {
      console.error('[Adjung DB] Failed to save entries to storage:', e);
    }
  }
  private saveSettingsToStorage() {
    try {
      localStorage.setItem('adjung_settings', JSON.stringify(this.systemSettings));
    } catch (e) {
      console.error('[Adjung DB] Failed to save settings to storage:', e);
    }
  }
  private saveLogsToStorage() {
    try {
      localStorage.setItem('adjung_logs', JSON.stringify(this.logs));
    } catch (e) {
      console.error('[Adjung DB] Failed to save logs to storage:', e);
    }
  }
  private saveReleaseLogsToStorage() {
    try {
      localStorage.setItem('adjung_release_logs', JSON.stringify(this.releaseLogs));
    } catch (e) {
      console.error('[Adjung DB] Failed to save release logs to storage:', e);
    }
  }
  private savePoliciesToStorage() {
    try {
      localStorage.setItem('adjung_policies', JSON.stringify(this.policies));
    } catch (e) {
      console.error('[Adjung DB] Failed to save policies to storage:', e);
    }
  }

  // --- RELEASE LOGS API ---
  getReleaseLogs(): ReleaseLog[] {
    return this.releaseLogs;
  }
  saveReleaseLog(log: ReleaseLog) {
    const idx = this.releaseLogs.findIndex(l => l.id === log.id);
    if (idx >= 0) {
      this.releaseLogs[idx] = log;
    } else {
      this.releaseLogs.push(log);
    }
    this.saveReleaseLogsToStorage();
  }
  deleteReleaseLog(id: string) {
    this.releaseLogs = this.releaseLogs.filter(l => l.id !== id);
    this.saveReleaseLogsToStorage();
  }

  // --- POLICIES API ---
  getPolicies(): PolicyDocument[] {
    return this.policies;
  }
  savePolicy(policy: PolicyDocument) {
    const idx = this.policies.findIndex(p => p.id === policy.id);
    policy.lastUpdated = new Date().toISOString();
    if (idx >= 0) {
      this.policies[idx] = policy;
    } else {
      this.policies.push(policy);
    }
    this.savePoliciesToStorage();
  }

  // Public APIs
  getUsers(): User[] {
    return this.users;
  }
  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());
  }

  updateUser(updatedUser: User) {
    this.users = this.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    this.saveUsersToStorage();
  }

  createUser(user: User) {
    this.users.push(user);
    this.saveUsersToStorage();

    // Create associated empty profile
    const newProfile: WriterProfile = {
      authorId: user.id,
      heroTitle: `${user.penName}’s Folio`,
      heroSubtitle: 'A collection of writings and academic journals.'
    };
    this.profiles.push(newProfile);
    this.saveProfilesToStorage();
    
    // Create associated identity
    const newIdentity: IdentityProfile = {
      identityId: `id-${user.id}`,
      accountId: user.id,
      username: user.username,
      displayName: user.penName,
      penName: user.penName,
      biography: `Biography for ${user.penName}. Academic scholar on Adjung.`,
      publicVisibility: 'Public',
      lifeTimeline: [],
      signatures: []
    };
    this.identities.push(newIdentity);
    this.saveIdentitiesToStorage();
  }

  deleteUser(id: string) {
    this.users = this.users.filter(u => u.id !== id);
    this.profiles = this.profiles.filter(p => p.authorId !== id);
    this.identities = this.identities.filter(i => i.accountId !== id);
    this.entries = this.entries.filter(e => e.authorId !== id);
    this.saveUsersToStorage();
    this.saveProfilesToStorage();
    this.saveIdentitiesToStorage();
    this.saveEntriesToStorage();
  }

  getProfiles(): WriterProfile[] {
    return this.profiles;
  }

  getProfileByAuthorId(authorId: string): WriterProfile {
    const found = this.profiles.find(p => p.authorId === authorId);
    if (found) return found;

    // Fallback if none exists
    const user = this.getUserById(authorId);
    const newProfile: WriterProfile = {
      authorId,
      heroTitle: user ? `${user.penName}’s Folio` : 'Academic Folio',
      heroSubtitle: 'A collection of writings and scholarly notes.'
    };
    this.profiles.push(newProfile);
    this.saveProfilesToStorage();
    return newProfile;
  }

  updateProfile(profile: WriterProfile) {
    this.profiles = this.profiles.map(p => p.authorId === profile.authorId ? profile : p);
    this.saveProfilesToStorage();
  }

  // --- IDENTITY STUDIO API ---
  getIdentities(): IdentityProfile[] {
    return this.identities;
  }
  
  getIdentityById(id: string): IdentityProfile | undefined {
    return this.identities.find(i => i.identityId === id);
  }
  
  getIdentityByAccountId(accountId: string): IdentityProfile | undefined {
    let identity = this.identities.find(i => i.accountId === accountId);
    if (!identity) {
      const user = this.getUserById(accountId);
      if (user) {
        identity = {
          identityId: `id-${accountId}`,
          accountId: accountId,
          username: user.username,
          displayName: user.penName || user.username,
          penName: user.penName || user.username,
          biography: user.bioSummary || '',
          publicVisibility: 'Public',
          lifeTimeline: [],
          signatures: user.signature ? [{
            id: `sig-${Date.now()}`,
            label: user.signature,
            type: 'typed',
            typedText: user.signature,
            fontFamily: 'Outfit',
            status: 'Default',
            strokes: [],
            createdAt: new Date().toISOString()
          }] : []
        };
        this.identities.push(identity);
        this.saveIdentitiesToStorage();
      }
    }
    return identity;
  }
  
  updateIdentity(identity: IdentityProfile) {
    const exists = this.identities.some(i => i.identityId === identity.identityId);
    if (exists) {
      this.identities = this.identities.map(i => i.identityId === identity.identityId ? identity : i);
    } else {
      this.identities.push(identity);
    }
    this.saveIdentitiesToStorage();
  }
  
  saveSignature(accountId: string, signature: DigitalSignature) {
    const identity = this.getIdentityByAccountId(accountId);
    if (!identity) return;
    
    // Set all other signatures to non-default if this is default
    let updatedSignatures = identity.signatures || [];
    if (signature.status === 'Default') {
      updatedSignatures = updatedSignatures.map(s => ({ ...s, status: s.status === 'Default' ? 'Archived' : s.status }));
    }
    
    const existingIndex = updatedSignatures.findIndex(s => s.id === signature.id);
    if (existingIndex >= 0) {
      updatedSignatures[existingIndex] = signature;
    } else {
      updatedSignatures.push(signature);
    }
    
    this.updateIdentity({ ...identity, signatures: updatedSignatures });
  }

  // --- CITATION LIBRARY API ---
  getCitations(): Citation[] {
    return this.citations;
  }

  getCitationById(id: string): Citation | undefined {
    return this.citations.find(c => c.id === id);
  }

  checkDuplicateCitation(citation: Omit<Citation, 'id'>): Citation | undefined {
    return this.citations.find(c => 
      c.title.toLowerCase() === citation.title.toLowerCase() && 
      c.author.toLowerCase() === citation.author.toLowerCase() && 
      c.year === citation.year
    );
  }

  createCitation(citation: Omit<Citation, 'id'>): Citation {
    const newCitation = { ...citation, id: `cit-${Date.now()}` };
    this.citations.push(newCitation);
    this.saveCitationsToStorage();
    return newCitation;
  }

  updateCitation(id: string, updates: Partial<Citation>) {
    this.citations = this.citations.map(c => c.id === id ? { ...c, ...updates } : c);
    this.saveCitationsToStorage();
  }

  getEntries(): Entry[] {
    return this.entries;
  }

  getEntriesByAuthor(authorId: string): Entry[] {
    return this.entries.filter(e => e.authorId === authorId);
  }

  getPublishedEntriesByAuthor(authorId: string): Entry[] {
    return this.entries.filter(e => e.authorId === authorId && e.status === 'Published' && e.visibility === 'Public');
  }

  getEntryById(id: string): Entry | undefined {
    return this.entries.find(e => e.id === id);
  }

  saveEntry(entry: Entry) {
    const index = this.entries.findIndex(e => e.id === entry.id);
    entry.updatedDate = new Date().toISOString();
    if (entry.contentType === 'Notice' || entry.contentType === "Editor's Note") {
      entry.publicationClass = 'Institutional';
      entry.isInstitutional = true;
      if (entry.status === 'Published') {
        entry.authorId = null;
        entry.publisher = 'Adjung Editorial Board';
      }
    }
    if (index >= 0) {
      this.entries[index] = entry;
    } else {
      entry.createdDate = new Date().toISOString();
      this.entries.push(entry);
    }
    this.saveEntriesToStorage();
  }

  deleteEntry(id: string) {
    this.entries = this.entries.filter(e => e.id !== id);
    this.saveEntriesToStorage();
  }

  getSystemSettings(): SystemSettings {
    return this.systemSettings;
  }

  updateSystemSettings(settings: SystemSettings) {
    this.systemSettings = settings;
    this.saveSettingsToStorage();
  }

  getLogs(): SystemLog[] {
    return this.logs;
  }

  addLog(action: string, operator: string, role: string) {
    const newLog: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operator,
      role,
      action
    };
    this.logs = [newLog, ...this.logs];
    this.saveLogsToStorage();
  }

  setUsers(users: User[]) {
    this.users = users;
    this.saveUsersToStorage();
  }

  setProfiles(profiles: WriterProfile[]) {
    this.profiles = profiles;
    this.saveProfilesToStorage();
  }

  setEntries(entries: Entry[]) {
    this.entries = entries;
    this.saveEntriesToStorage();
  }

  setSystemSettings(settings: SystemSettings) {
    this.systemSettings = settings;
    this.saveSettingsToStorage();
  }

  setIdentities(identities: IdentityProfile[]) {
    this.identities = identities;
    this.saveIdentitiesToStorage();
  }

  setLogs(logs: any[]) {
    this.logs = logs;
    this.saveLogsToStorage();
  }

  resetToDefaults() {
    this.users = INITIAL_USERS;
    this.profiles = INITIAL_PROFILES;
    this.identities = INITIAL_IDENTITIES;
    this.citations = INITIAL_CITATIONS;
    this.entries = INITIAL_ENTRIES;
    this.systemSettings = INITIAL_SYSTEM_SETTINGS;
    this.logs = INITIAL_LOGS;
    this.releaseLogs = INITIAL_RELEASE_LOGS;
    this.policies = INITIAL_POLICIES;
    this.saveUsersToStorage();
    this.saveProfilesToStorage();
    this.saveIdentitiesToStorage();
    this.saveCitationsToStorage();
    this.saveEntriesToStorage();
    this.saveSettingsToStorage();
    this.saveLogsToStorage();
    this.saveReleaseLogsToStorage();
    this.savePoliciesToStorage();
  }
}

export const db = new AdjungDb();
