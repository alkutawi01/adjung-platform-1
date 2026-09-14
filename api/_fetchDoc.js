// Shared by api/fetch-doc.js (Vercel) and server.js (local dev).
// Underscore prefix keeps Vercel from exposing this file as its own route.
const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024;

function toGoogleDocExportUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'docs.google.com') return null;
  if (!parsed.pathname.startsWith('/document/d/')) return null;

  if (!parsed.pathname.includes('/export') && !parsed.pathname.includes('/pub')) {
    const base = parsed.pathname.split('/edit')[0].replace(/\/$/, '');
    return `https://docs.google.com${base}/export?format=txt`;
  }
  return parsed.toString();
}

async function readCapped(response) {
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error('Document too large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function fetchDocText(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { status: 400, body: { error: 'URL is required' } };
  }
  const url = toGoogleDocExportUrl(rawUrl);
  if (!url) {
    return { status: 400, body: { error: 'Only Google Docs URLs are supported' } };
  }

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) {
      return { status: 502, body: { error: 'Failed to fetch Google Doc' } };
    }
    const html = await readCapped(response);

    const cleanedHtml = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    const bodyMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : cleanedHtml;

    const text = bodyHtml
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n\s*\n/g, '\n\n');

    return { status: 200, body: { text: text.trim() } };
  } catch {
    return { status: 502, body: { error: 'Failed to fetch Google Doc' } };
  }
}
