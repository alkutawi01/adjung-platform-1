// Supabase Auth storage adapter backed by a domain-wide cookie instead of
// localStorage. localStorage is scoped per-origin, so a session on
// adjung.com would never be visible on username.adjung.com — each author
// subdomain is a distinct browser origin. A cookie scoped to the root
// domain (.adjung.com) is shared by every subdomain automatically.

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getRootDomain(hostname: string): string {
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    // *.localhost all resolve to 127.0.0.1 and share cookies scoped to
    // "localhost" — this is what makes local subdomain testing possible.
    return 'localhost';
  }
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  const domain = getRootDomain(window.location.hostname);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Domain=${domain}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function deleteCookie(name: string): void {
  const domain = getRootDomain(window.location.hostname);
  document.cookie = `${name}=; Domain=${domain}; Path=/; Max-Age=0; SameSite=Lax`;
}

export const cookieStorage = {
  getItem: (key: string): string | null => readCookie(key),
  setItem: (key: string, value: string): void => writeCookie(key, value),
  removeItem: (key: string): void => deleteCookie(key),
};
