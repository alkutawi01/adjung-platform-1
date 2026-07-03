export type UserRole = 'Chief Editor' | 'Editor' | 'Writer' | 'Visitor';

export interface RolePermissions {
  viewIndex: boolean;
  viewDirectory: boolean;
  curateFrontpage: boolean;
  inviteWriters: boolean;
  moderateReports: boolean;
  editOthersContent: boolean; // LOCKED FALSE
  manageSettings: boolean;    // LOCKED (TRUE for Chief Editor, FALSE for others)
  manageRbac: boolean;        // LOCKED (TRUE for Chief Editor, FALSE for others)
  manageLogs: boolean;
}

export interface User {
  id: string; // UUID or simple identifier
  username: string;
  email: string;
  role: UserRole;
  penName: string;
  signature: string; // Text representation of handwritten signature or styling instructions
  avatarColor?: string;
  bioSummary?: string;
  suspended?: boolean;
}

export type EntryType = 'Note' | 'Essay' | 'Article';
export type EntryStatus = 'Draft' | 'Published' | 'Archived';
export type EntryVisibility = 'Public' | 'Private';

export interface Entry {
  id: string;
  authorId: string;
  contentType: EntryType;
  status: EntryStatus;
  visibility: EntryVisibility;
  createdDate: string; // ISO String
  updatedDate: string; // ISO String
  publishedDate: string | null; // ISO String
  title: string;
  slug: string;
  tags: string[];
  canonicalUrl: string;
  content: string; // Rich text / markdown or custom structured format
  footnotes?: string[]; // Used for Essay
  marginNotes?: { [key: number]: string }; // Map of paragraph index to margin note text for Article
}

export interface BiographyItem {
  id: string;
  year: string;
  title: string;
  description: string;
  category: 'Education' | 'Career' | 'Publication' | 'Award' | 'Personal' | 'Other';
}

export interface WriterProfile {
  authorId: string;
  bioText: string;
  lifeTimeline: BiographyItem[];
  heroTitle: string;
  heroSubtitle: string;
  heroSignatureText: string;
}

export interface SystemSettings {
  academicAffiliation: string;
  editorialPolicy: string;
  accentColor: string;
  allowSelfRegistration: boolean;
  featuredScholarId?: string;
  featuredEntryId?: string;
  announcementBanner?: string;
  enableArabicAccent?: boolean;
  layoutDensity?: 'Standard' | 'Compact' | 'Classical';
  rolePermissions?: {
    'Chief Editor': RolePermissions;
    'Editor': RolePermissions;
    'Writer': RolePermissions;
    'Visitor': RolePermissions;
  };
}

export interface SystemLog {
  id: string;
  timestamp: string;
  operator: string;
  role: string;
  action: string;
}
