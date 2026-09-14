// Shared by api/news.js (Vercel) and server.js (local dev).
// Output uses the same Desk/Title/Summary/Source/URL format as the
// In The News Google Doc, so the frontend parser is reused unchanged.
const FEEDS = [
  { url: 'https://www.sciencedaily.com/rss/space_time.xml', desk: 'Space', source: 'ScienceDaily' },
  { url: 'https://www.sciencedaily.com/rss/fossils_ruins.xml', desk: 'Archaeology', source: 'ScienceDaily' },
  { url: 'https://www.sciencedaily.com/rss/health_medicine.xml', desk: 'Medicine', source: 'ScienceDaily' },
  { url: 'https://www.sciencedaily.com/rss/earth_climate.xml', desk: 'Environment', source: 'ScienceDaily' },
  { url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml', desk: 'Artificial Intelligence', source: 'ScienceDaily' },
  { url: 'https://www.sciencenews.org/feed', desk: 'Science', source: 'Science News' },
  { url: 'https://www.archaeology.org/rss.xml', desk: 'Heritage', source: 'Archaeology Magazine' },
];

const PER_FEED = 12;
const MAX_ITEMS = 50;
const TIMEOUT_MS = 10000;
const TITLE_MAX = 80;
const SUMMARY_MAX = 220;

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function clean(raw) {
  const text = raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<p>The post [\s\S]*$/i, '');
  return decodeEntities(decodeEntities(text).replace(/<[^>]+>/g, ' '))
    .replace(/\[(…|\.\.\.)\]/g, '…')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWord(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–-]+$/, '')}…`;
}

function field(itemXml, tag) {
  const m = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? clean(m[1]) : '';
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': 'AdjungPlatform/1.0 (+https://platform.adjung.com)' },
  });
  if (!res.ok) throw new Error(`${feed.url} ${res.status}`);
  const xml = await res.text();
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];

  return items.slice(0, PER_FEED).map(item => {
    const title = field(item, 'title');
    const summary = field(item, 'description');
    const url = field(item, 'link');
    const published = Date.parse(field(item, 'pubDate')) || 0;
    return { ...feed, title, summary, url, published };
  }).filter(i => i.title && i.title.length <= TITLE_MAX && i.summary && /^https?:\/\//.test(i.url));
}

export async function fetchNewsText() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const perFeed = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.sort((a, b) => b.published - a.published));

  const seen = new Set();
  const merged = [];
  for (let round = 0; round < PER_FEED && merged.length < MAX_ITEMS; round++) {
    for (const list of perFeed) {
      const item = list[round];
      if (!item || seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push(item);
      if (merged.length >= MAX_ITEMS) break;
    }
  }

  return merged
    .map(i => [
      `Desk: ${i.desk}`,
      `Title: ${i.title}`,
      `Summary: ${truncateAtWord(i.summary, SUMMARY_MAX)}`,
      `Source: ${i.source}`,
      `URL: ${i.url}`,
    ].join('\n'))
    .join('\n⸻\n');
}
