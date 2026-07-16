import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json());

// Proxies Google Doc content fetches (In The News, World Clock, Research Findings widgets)
// so the browser doesn't hit CORS restrictions fetching docs.google.com directly.
app.get('/api/fetch-doc', async (req, res) => {
  let { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Auto-rewrite standard Google Doc URLs to text export format for clean parsing
  if (url.includes('docs.google.com/document/d/') && !url.includes('/export') && !url.includes('/pub')) {
    let targetUrl = url.split('/edit')[0];
    if (targetUrl.endsWith('/')) {
      targetUrl = targetUrl.slice(0, -1);
    }
    url = `${targetUrl}/export?format=txt`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch Google Doc' });
    }
    const html = await response.text();

    let cleanedHtml = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

    const bodyMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyHtml = bodyMatch ? bodyMatch[1] : cleanedHtml;

    let text = bodyHtml
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n\s*\n/g, "\n\n");

    return res.json({ text: text.trim() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// In production, this same process also serves the built frontend
// (npm run build → dist/), so one deployed service handles everything —
// no separate static host or reverse proxy needed.
if (isProduction) {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Adjung server running on http://localhost:${PORT}${isProduction ? ' (production, serving built frontend)' : ' (API proxy only — run alongside `vite` in dev)'}`);
});
