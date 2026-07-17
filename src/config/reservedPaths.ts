// Single source of truth for subdomains/usernames that can't be claimed —
// previously duplicated (with drift) across App.tsx and Step7PersonalSite.tsx.
export const RESERVED_PATHS = [
  'admin', 'api', 'search', 'settings', 'login', 'register', 'frontpage',
  'directory', 'index', 'editorium', 'desk', 'folio', 'bio', 'notices',
  'notice', 'editorial', 'changelog', 'policies', 'identity', 'adjung',
  'support', 'help', 'www', 'blog',
];
