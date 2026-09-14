import { fetchNewsText } from './_news.js';

// Evergreen science/heritage news: one upstream fetch per day is enough.
const CACHE_CONTROL = 's-maxage=86400, stale-while-revalidate=86400';

export default async function handler(req, res) {
  try {
    const text = await fetchNewsText();
    if (!text) {
      return res.status(502).json({ error: 'No news feeds available' });
    }
    res.setHeader('Cache-Control', CACHE_CONTROL);
    return res.status(200).json({ text });
  } catch {
    return res.status(502).json({ error: 'No news feeds available' });
  }
}
