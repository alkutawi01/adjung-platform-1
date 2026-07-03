import { User, UserRole, Entry, WriterProfile, IdentityProfile, DigitalSignature, Citation, SystemSettings, BiographyItem, SystemLog } from '../types';

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
    operator: 'T. Malik',
    role: 'Chief Editor',
    action: 'Assigned Editor role to Amina Masri for curation support.'
  },
  {
    id: 'log-4',
    timestamp: '2026-06-30T11:22:00Z',
    operator: 'Ed. Amina',
    role: 'Editor',
    action: 'Curated frontpage featured entries list.'
  }
];

// Pre-seeded Users
export const INITIAL_USERS: User[] = [
  {
    id: 'user-tariq-malik',
    username: 'tariq.malik',
    email: 'tariq@adjung.com',
    role: 'Chief Editor',
    penName: 'T. Malik',
    signature: 'Prof. Tariq Malik',
    avatarColor: 'bg-stone-800 text-stone-100',
    bioSummary: 'Professor Emeritus of Islamic Philosophy and Comparative Literature. Chief Editor of Adjung.'
  },
  {
    id: 'user-associate-editor',
    username: 'editor.amina',
    email: 'amina_ed@adjung.com',
    role: 'Editor',
    penName: 'Ed. Amina',
    signature: 'Amina (Editor)',
    avatarColor: 'bg-stone-700 text-stone-100',
    bioSummary: 'Associate Editor at Adjung, curating published indices and frontpage folios.'
  },
  {
    id: 'user-zayd-ghazali',
    username: 'zayd.ghazali',
    email: 'zayd@adjung.com',
    role: 'Writer',
    penName: 'Al-Ghazali',
    signature: 'Zayd Al-Ghazali',
    avatarColor: 'bg-emerald-950 text-emerald-100',
    bioSummary: 'Scholarly writer focusing on the synthesis of medieval Arabic logic and modern typographic form.'
  },
  {
    id: 'user-amina-masri',
    username: 'amina.masri',
    email: 'amina@adjung.com',
    role: 'Writer',
    penName: 'Al-Masri',
    signature: 'Amina Al-Masri',
    avatarColor: 'bg-blue-950 text-blue-100',
    bioSummary: 'Maritime historian specializing in Red Sea trading hubs and pre-modern Levantine trade routes.'
  },
  {
    id: 'user-sarah-henderson',
    username: 'sarah.henderson',
    email: 'sarah@adjung.com',
    role: 'Writer',
    penName: 'Henderson',
    signature: 'S. Henderson',
    avatarColor: 'bg-red-950 text-red-100',
    bioSummary: 'Typographer and scholar examining the intersection of modern Swiss rationalism and traditional book design.'
  }
];

export const INITIAL_IDENTITIES: IdentityProfile[] = [
  {
    identityId: 'id-user-zayd-ghazali',
    accountId: 'user-zayd-ghazali',
    username: 'zayd.ghazali',
    displayName: 'Zayd Al-Ghazali',
    penName: 'Al-Ghazali',
    biography: `Zayd Al-Ghazali is a reader and scribe of classical Islamic texts, currently investigating the formal connections between medieval Andalusian manuscript structures and Swiss typographic systems. His work frequently bridges Arabic and Jawi calligraphic disciplines with strict modular layout design. 

He holds a doctorate in Comparative Semiotics and splits his academic research between Cairo and Cordoba. Adjung serves as his central repository of unfiltered research notes, complete essays, and formal articles.`,
    publicVisibility: 'Public',
    lifeTimeline: [
      {
        id: 'bio-zayd-1',
        year: '2012',
        title: 'Academic Foundations',
        description: 'Completed Bachelor’s degree in Classical Arabic Philology with a thesis on the logical treatises of Averroes.',
        category: 'Education'
      },
      {
        id: 'bio-zayd-2',
        year: '2015',
        title: 'Andalusian Manuscripts Fellowship',
        description: 'Appointed research fellow at the University of Cordoba, documenting ink chemistry and margin conventions in 12th-century manuscripts.',
        category: 'Career'
      },
      {
        id: 'bio-zayd-3',
        year: '2019',
        title: 'Doctoral Defense',
        description: 'Successfully defended his dissertation titled "The Linear Scribe: Mathematical Order in Calligraphic Manuscripts."',
        category: 'Education'
      },
      {
        id: 'bio-zayd-4',
        year: '2022',
        title: 'Publication: The Silent Scribe',
        description: 'Published his first full monograph, examining the typographic grids of the earliest printed Arabic treatises in Europe.',
        category: 'Publication'
      },
      {
        id: 'bio-zayd-5',
        year: '2025',
        title: 'Inaugural Scholar at Adjung',
        description: 'Joined the Adjung scholarly board as a founding writer to establish a classical editorial folio.',
        category: 'Personal'
      }
    ],
    signatures: []
  },
  {
    identityId: 'id-user-amina-masri',
    accountId: 'user-amina-masri',
    username: 'amina.masri',
    displayName: 'Amina Al-Masri',
    penName: 'Al-Masri',
    biography: `Amina Al-Masri is a maritime historian and field archaeologist. For over a decade, her research has focused on the maritime trade routes of the Indian Ocean and the Red Sea during late antiquity and the early Islamic period. 

She acts as a consultant for maritime heritage preservation and teaches Economic History. Through her Adjung Folio, she hosts extensive articles complete with historical margin annotations, mapping trade registries onto modern geographic records.`,
    publicVisibility: 'Public',
    lifeTimeline: [
      {
        id: 'bio-amina-1',
        year: '2010',
        title: 'Archaeological Fieldwork at Quseir al-Qadim',
        description: 'Participated in the excavation of Roman and medieval Islamic artifacts, specializing in ceramic shard classification.',
        category: 'Career'
      },
      {
        id: 'bio-amina-2',
        year: '2014',
        title: 'Master of Arts in Historical Geography',
        description: 'Graduated from the School of Oriental and African Studies (SOAS) with distinction.',
        category: 'Education'
      },
      {
        id: 'bio-amina-3',
        year: '2018',
        title: 'The Levantine Exchange Prize',
        description: 'Received the Mediterranean Historical Society prize for her paper on spice custom tariffs in medieval Alexandria.',
        category: 'Award'
      },
      {
        id: 'bio-amina-4',
        year: '2021',
        title: 'Appointment to the Levant Institute',
        description: 'Appointed Senior Lecturer in Maritime Archaeology and Levantine History.',
        category: 'Career'
      }
    ],
    signatures: []
  },
  {
    identityId: 'id-user-sarah-henderson',
    accountId: 'user-sarah-henderson',
    username: 'sarah.henderson',
    displayName: 'Sarah Henderson',
    penName: 'Henderson',
    biography: `Sarah Henderson is an independent typographer, editorial designer, and visual scholar based in Zurich. Her work critiques the seamlessness of modern software UI, proposing instead an "architecturally honest" and tactile approach to reading online. 

Her Adjung Folio features highly structured layout reflections and critical articles analyzing type design history and bookbinding philosophy.`,
    publicVisibility: 'Public',
    lifeTimeline: [
      {
        id: 'bio-sarah-1',
        year: '2013',
        title: 'Apprenticeship in Letterpress',
        description: 'Completed a rigorous two-year practical training program at a traditional hot-metal letterpress workshop in Leipzig.',
        category: 'Education'
      },
      {
        id: 'bio-sarah-2',
        year: '2017',
        title: 'Studio Foundation',
        description: 'Established "Studio Henderson", focusing on high-end book design and academic journal curation.',
        category: 'Career'
      },
      {
        id: 'bio-sarah-3',
        year: '2023',
        title: 'Exhibition: The Unread Page',
        description: 'Curated a widely reviewed typographic exhibition at the Zurich Museum of Design, exploring margin aesthetics.',
        category: 'Publication'
      }
    ],
    signatures: []
  }
];

export const INITIAL_CITATIONS: Citation[] = [
  {
    id: 'cit-tufte',
    author: 'Tufte, E. R.',
    title: 'The Visual Display of Quantitative Information',
    year: 2001,
    publisher: 'Graphics Press',
    url: 'https://edwardtufte.com'
  }
];

// Pre-seeded Biographies and Profiles
export const INITIAL_PROFILES: WriterProfile[] = [
  {
    authorId: 'user-zayd-ghazali',
    heroTitle: 'On the Geometry of Reason',
    heroSubtitle: 'A collection of thoughts, essays, and notes examining classical rationalism, Andalusian aesthetics, and contemporary typography.'
  },
  {
    authorId: 'user-amina-masri',
    heroTitle: 'Maritime Pathways & Levantine Shores',
    heroSubtitle: 'Exploring the rich, forgotten commerce networks, port cities, and material cultures of the pre-modern Red Sea.'
  },
  {
    authorId: 'user-sarah-henderson',
    heroTitle: 'Form Follows Friction',
    heroSubtitle: 'Essays on Swiss functionalism, high-contrast typography, and the preservation of tactile editorial hierarchies in digital spaces.'
  }
];

// Pre-seeded Entries
export const INITIAL_ENTRIES: Entry[] = [
  // --- ZAYD AL-GHAZALI ---
  {
    id: 'entry-zayd-1',
    authorId: 'user-zayd-ghazali',
    contentType: 'Essay',
    status: 'Published',
    visibility: 'Public',
    createdDate: '2025-11-12T10:00:00Z',
    updatedDate: '2025-11-12T14:30:00Z',
    publishedDate: '2025-11-12T14:30:00Z',
    title: 'The Typographic Geometry of Classical Manuscripts',
    slug: 'typographic-geometry-classical-manuscripts',
    tags: ['Typography', 'Manuscripts', 'Andalusian', 'Geometry'],
    canonicalUrl: 'https://zayd.adjung.com/essay/typographic-geometry-classical-manuscripts',
    content: `Scholarly discussion surrounding the design of manuscripts often treats the visual layout as secondary to the written message. Yet, in classical Andalusian and Persian scriptoria, the page was treated as a mathematical canvas. The scribe began not with words, but with a system of invisible divisions.

Before a single drop of ink met the vellum, the page was folded or scored using a lead point. This established the *Mizan*—the balance of proportions. These geometric structures were not arbitrary; they adhered strictly to natural ratios, often mirroring the golden ratio or simple musical consonances.

In modern screen-based typography, we have largely abandoned this physical grid in favor of fluid, liquid layouts. While fluid grids offer responsiveness, they frequently lack the architectural grounding that stabilizes deep reading. By re-examining the scribal grid, we discover that the margin is not "empty" space; it is the structural support that gives the text block its gravity and authority.

The dialogue between Arabic script lines (the *satr*) and the surrounding annotations in the margins exemplifies a dual-layer reading experience. The primary text flows in an orderly, rhythmic horizontal progression, while the marginal comments (often written diagonally) offer a secondary, exploratory track. This invites the reader into an active, polyphonic relationship with the manuscript.`,
    footnotes: [
      'The term "Mizan" (ميزان) denotes not merely a physical scale, but the philosophical concept of cosmic and ethical balance as elaborated by Ibn Rushd.',
      'See Jan Tschichold’s "The Form of the Book" (1975) for a detailed modern analysis of classical European manuscript proportions, which share deep geometric roots with Islamic scribal arts.',
      'Diagonally oriented margin annotations, known as *Hashiyah*, were historically used to distinguish subsequent commentary from the authoritative canonical text.'
    ]
  },
  {
    id: 'entry-zayd-2',
    authorId: 'user-zayd-ghazali',
    contentType: 'Note',
    status: 'Published',
    visibility: 'Public',
    createdDate: '2026-03-15T09:12:00Z',
    updatedDate: '2026-03-15T09:12:00Z',
    publishedDate: '2026-03-15T09:15:00Z',
    title: 'On the Concept of Al-Mizan (الميزان) and Structural Restraint',
    slug: 'concept-of-al-mizan-structural-restraint',
    tags: ['Philosophy', 'Arabic Script', 'Restraint'],
    canonicalUrl: 'https://zayd.adjung.com/note/concept-of-al-mizan-structural-restraint',
    content: `When writing in classical Arabic, the calligraphy itself demands a profound physical discipline. Every letter's scale is dictated by the width of the reed pen (the *nuqtah* or dot). This is the absolute unit of measure.

The concept of *Al-Mizan* (الميزان) is beautiful because it establishes that freedom exists only *within* absolute boundaries. Without the mathematical discipline of the dot, the calligraphy descends into chaotic scribble.

<quote type="arabic">
  <arabic>في الخط العربي، الميزان هو الذي يمنح الحرف هيبته ووقاره. بدونه، يفقد النص توازنه الروحي والبصري.</arabic>
  <translation>In Arabic calligraphy, the balance is what gives the letter its prestige and dignity. Without it, the text loses its spiritual and visual equilibrium.</translation>
</quote>

In our digital editorial interfaces, we must learn this lesson. True visual luxury does not come from features, custom color pickers, or endless options. It comes from the strict, unyielding restraint of a well-defined grid and a single, flawless typeface.`
  },
  {
    id: 'entry-zayd-3',
    authorId: 'user-zayd-ghazali',
    contentType: 'Note',
    status: 'Draft',
    visibility: 'Private',
    createdDate: '2026-06-20T18:00:00Z',
    updatedDate: '2026-06-20T18:05:00Z',
    publishedDate: null,
    title: 'Draft: Reflection on Cordova Ink Recipes',
    slug: 'draft-reflection-cordova-ink-recipes',
    tags: ['History', 'Manuscripts', 'Andalusian'],
    canonicalUrl: 'https://zayd.adjung.com/note/draft-reflection-cordova-ink-recipes',
    content: `Researching the 11th-century treatise on calligraphic inks by Ibn Badis. The recipe for "soot ink" (Hibr al-Khulūd) calls for burnt flaxseed oil mixed with gum arabic and a precise volume of pomegranate rinds. 

The inclusion of pomegranate provides a rich, slightly acidic property that etches the ink deep into the vellum, preventing flaking over centuries. There is an incredible architectural honesty in using organic, structural materials to secure temporal permanence. Need to test modern adaptations of these formulas with linen vellum.`
  },

  // --- AMINA AL-MASRI ---
  {
    id: 'entry-amina-1',
    authorId: 'user-amina-masri',
    contentType: 'Article',
    status: 'Published',
    visibility: 'Public',
    createdDate: '2025-08-04T11:00:00Z',
    updatedDate: '2025-08-05T12:00:00Z',
    publishedDate: '2025-08-05T12:00:00Z',
    title: 'The Red Sea Trade Routes in Late Antiquity',
    slug: 'red-sea-trade-routes-late-antiquity',
    tags: ['History', 'Maritime', 'Trade', 'Late Antiquity'],
    canonicalUrl: 'https://amina.adjung.com/article/red-sea-trade-routes-late-antiquity',
    content: `The Red Sea, historically known to Roman cartographers as the *Sinus Arabicus*, was far more than a geographical barrier between the African continent and the Arabian peninsula. It was the vital artery of global commerce connecting the Roman Mediterranean with the wealthy merchant guilds of India and Southern Arabia.

The journey began at Alexandria, where goods were transported via the Nile to Coptos, and then traversed through the eastern desert by camel caravan to the ports of Myos Hormos and Berenike. These desert pathways were heavily guarded by Roman garrisons, securing high-value luxury commodities such as frankincense, myrrh, pepper, and silk.

At the port cities, massive dhows constructed using teak planks sewn together with coconut fiber coir awaited the seasonal monsoon winds. Sailing during the summer required absolute precision; the northern winds blew consistently south, propelling ships rapidly through the narrow channels of the Red Sea, but navigating around coral shoals was treacherous.

Upon reaching the Bab-el-Mandeb strait, ships entered the open waters of the Gulf of Aden, embarking on the trans-oceanic crossing to the Malabar coast of India. The returns on these voyages were monumental. A single Roman merchant fleet could bring back cargo worth millions of sesterces, contributing a significant percentage of the empire's custom revenues.

The archaeological excavations of the past decades have revealed the cosmopolitan nature of these ports. Shards of Indian cooking pots, Roman amphorae from Campania, and early Axumite coins sit side by side in the stratigraphic layers, offering silent testimony to an era of profound intercultural exchange.`,
    marginNotes: {
      0: 'Myos Hormos, located at modern Quseir al-Qadim, was identified in the 1970s as one of the primary Roman gatehouses to the Indian Ocean.',
      1: 'Pliny the Elder famously complained about the massive economic drain of this trade, claiming Rome lost over 50 million sesterces annually to Eastern luxuries.',
      2: 'Sewn boat construction, or "lashed-plank" building, remained the dominant maritime engineering tradition in the Western Indian Ocean for over a millennium.',
      4: 'Berenike archaeological surveys have recently uncovered the remains of a dedicated temple dedicated to Serapis, alongside Sanskrit papyrus inscriptions.'
    }
  },
  {
    id: 'entry-amina-2',
    authorId: 'user-amina-masri',
    contentType: 'Note',
    status: 'Published',
    visibility: 'Public',
    createdDate: '2026-05-10T14:22:00Z',
    updatedDate: '2026-05-10T14:22:00Z',
    publishedDate: '2026-05-10T14:30:00Z',
    title: 'The Sound of the Sewn Hull',
    slug: 'sound-of-sewn-hull',
    tags: ['History', 'Maritime', 'Acoustics'],
    canonicalUrl: 'https://amina.adjung.com/note/sound-of-sewn-hull',
    content: `There is a unique acoustic dimension to pre-modern wooden sailing vessels. Unlike Roman iron-nailed galleys, the stitched dhows of the western Indian Ocean were extraordinarily flexible. 

When sailing through heavy swells, the hull did not crash rigidly against the waves. Instead, it groaned and flexed organically, the coir fibers tightening and absorbing the structural tension. Sailors described the sound as a rhythmic, breathing dialogue between the ocean and the timber. It was a material symbiosis.`
  },

  // --- SARAH HENDERSON ---
  {
    id: 'entry-sarah-1',
    authorId: 'user-sarah-henderson',
    contentType: 'Article',
    status: 'Published',
    visibility: 'Public',
    createdDate: '2026-01-20T09:00:00Z',
    updatedDate: '2026-01-20T10:15:00Z',
    publishedDate: '2026-01-20T10:15:00Z',
    title: 'Modernism and the Swiss Grid System',
    slug: 'modernism-swiss-grid-system',
    tags: ['Typography', 'Swiss Design', 'Modernism', 'Grid'],
    canonicalUrl: 'https://sarah.adjung.com/article/modernism-swiss-grid-system',
    content: `The Swiss Grid represents the peak of rationalism in editorial design. Emerged in Zurich and Basel during the mid-20th century, designers like Emil Ruder and Josef Müller-Brockmann sought a layout language that was objective, functional, and free from ornament.

The grid was not a cage, but a structural skeleton. By dividing the page into standard columns, the designer could arrange typography, images, and negative space in a predictable yet highly dynamic hierarchy. It established a structural honesty where every element's placement was mathematically justified.

However, the digital translation of the Swiss Grid has often stripped it of its tactile elegance. On the web, grids are often treated as responsive fluid percentages that stretch and squish based on the viewport. This makes reading unpredictable and chaotic. 

<quote type="latin"><text>Typography has one plain duty before it and that is to convey information in writing. No subtlety of layout, no regional accent, no visual gimmickry should stand in the way of this supreme purpose.</text></quote>

To restore the dignity of typographic grids on screens, we must treat the screen not as an infinite fluid canvas, but as an editorial page with fixed typographic proportions, generous margins, and strict vertical rhythm. Only then can the digital page achieve the quiet authority of a physical monograph.`,
    marginNotes: {
      0: 'Müller-Brockmann’s seminal text "Grid Systems in Graphic Design" (1981) remains the definitive bible for structural page architecture.',
      1: 'The grid’s primary purpose is to establish "rhythm". Just as in musical composition, the silent intervals are as critical as the sounding notes.',
      3: 'The choice of typeface—traditionally Haas Grotesk, which became Helvetica—reinforced the ethos of absolute semantic neutrality.'
    }
  }
];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  academicAffiliation: 'Consortium of Independent Editorial Scholars',
  editorialPolicy: 'Adjung maintains a text-first, classical layout discipline inspired by early European university journals and Arabic calligraphic treatises.',
  accentColor: '#802334',
  allowSelfRegistration: false,
  featuredScholarId: 'user-zayd-ghazali',
  featuredEntryId: 'entry-zayd-1',
  announcementBanner: 'Welcome to the Adjung scholarly archive. The independent digital press.',
  enableArabicAccent: true,
  layoutDensity: 'Standard',
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
      manageLogs: true
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
      manageLogs: false
    },
    'Writer': {
      viewIndex: false,
      viewDirectory: false,
      curateFrontpage: false,
      inviteWriters: false,
      moderateReports: false,
      editOthersContent: false,
      manageSettings: false,
      manageRbac: false,
      manageLogs: false
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
      manageLogs: false
    }
  }
};

// Database class helper to encapsulate read/write
class AdjungDb {
  private users: User[] = [];
  private profiles: WriterProfile[] = [];
  private identities: IdentityProfile[] = [];
  private citations: Citation[] = [];
  private entries: Entry[] = [];
  private systemSettings: SystemSettings = INITIAL_SYSTEM_SETTINGS;
  private logs: SystemLog[] = [];

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
        // Ensure all INITIAL_USERS are present in the list (so they can't be permanently deleted/lost)
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
        this.entries = JSON.parse(storedEntries);
        // Normalize entries for new metadata compatibility
        this.entries.forEach(e => {
          if (e.excerpt === undefined) e.excerpt = '';
          if (e.featuredImage === undefined) e.featuredImage = '';
          if (e.revisions === undefined) e.revisions = [];
          if (e.citations === undefined) e.citations = [];
          if (e.referenceSortOrder === undefined) e.referenceSortOrder = 'alphabetical';
          e.revisions.forEach(r => {
            if (r.citations === undefined) r.citations = [];
            if (r.referenceSortOrder === undefined) r.referenceSortOrder = 'alphabetical';
          });
        });
      } else {
        this.entries = INITIAL_ENTRIES;
        this.saveEntriesToStorage();
      }

      if (storedSettings) {
        this.systemSettings = JSON.parse(storedSettings);

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
            // Directory is KIV - disable viewDirectory permission for Writer and Visitor
            if (role === 'Writer' || role === 'Visitor') {
              this.systemSettings.rolePermissions[role].viewDirectory = false;
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
    } catch (e) {
      console.error('Error loading Adjung DB, fallback to initial data', e);
      this.users = INITIAL_USERS;
      this.profiles = INITIAL_PROFILES;
      this.identities = INITIAL_IDENTITIES;
      this.citations = INITIAL_CITATIONS;
      this.entries = INITIAL_ENTRIES;
      this.systemSettings = INITIAL_SYSTEM_SETTINGS;
      this.logs = INITIAL_LOGS;
    }
  }

  // Save methods
  public saveUsersToStorage() {
    localStorage.setItem('adjung_users', JSON.stringify(this.users));
  }
  private saveProfilesToStorage() {
    localStorage.setItem('adjung_profiles', JSON.stringify(this.profiles));
  }
  private saveIdentitiesToStorage() {
    localStorage.setItem('adjung_identities', JSON.stringify(this.identities));
  }
  private saveCitationsToStorage() {
    localStorage.setItem('adjung_citations', JSON.stringify(this.citations));
  }
  private saveEntriesToStorage() {
    localStorage.setItem('adjung_entries', JSON.stringify(this.entries));
  }
  private saveSettingsToStorage() {
    localStorage.setItem('adjung_settings', JSON.stringify(this.systemSettings));
  }
  private saveLogsToStorage() {
    localStorage.setItem('adjung_logs', JSON.stringify(this.logs));
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
    return this.identities.find(i => i.accountId === accountId);
  }
  
  updateIdentity(identity: IdentityProfile) {
    this.identities = this.identities.map(i => i.identityId === identity.identityId ? identity : i);
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

  resetToDefaults() {
    this.users = INITIAL_USERS;
    this.profiles = INITIAL_PROFILES;
    this.identities = INITIAL_IDENTITIES;
    this.citations = INITIAL_CITATIONS;
    this.entries = INITIAL_ENTRIES;
    this.systemSettings = INITIAL_SYSTEM_SETTINGS;
    this.logs = INITIAL_LOGS;
    this.saveUsersToStorage();
    this.saveProfilesToStorage();
    this.saveIdentitiesToStorage();
    this.saveCitationsToStorage();
    this.saveEntriesToStorage();
    this.saveSettingsToStorage();
    this.saveLogsToStorage();
  }
}

export const db = new AdjungDb();
