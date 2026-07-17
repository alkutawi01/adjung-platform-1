// Supabase Auth storage adapter backed by a domain-wide cookie instead of
// localStorage. localStorage is scoped per-origin, so a session on
// adjung.com would never be visible on username.adjung.com — each author
// subdomain is a distinct browser origin. A cookie scoped to the root
// domain (.adjung.com) is shared by every subdomain automatically.

import { getRootDomainFromHostname } from '../utils';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const getRootDomain = getRootDomainFromHostname;

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

/**
 * Explicitly clears every sb-*-auth-token cookie. Supabase's own
 * auth.signOut() is expected to call storage.removeItem() for its session
 * key, but in practice this session's testing found the cookie survives
 * signOut() regardless — so AuthService.signOut() calls this directly as
 * a guaranteed clear, rather than trusting that internal path alone.
 */
export function clearAllSupabaseCookies(): void {
  const names = document.cookie
    .split('; ')
    .map(pair => pair.split('=')[0])
    .filter(name => name.startsWith('sb-') && name.endsWith('-auth-token'));
  names.forEach(deleteCookie);
}
