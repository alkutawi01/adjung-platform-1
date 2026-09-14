import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchDocText } from './api/_fetchDoc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json());

// Proxies Google Doc content fetches (In The News, World Clock, Research Findings widgets)
// so the browser doesn't hit CORS restrictions fetching docs.google.com directly.
app.get('/api/fetch-doc', async (req, res) => {
  const { status, body } = await fetchDocText(req.query.url);
  return res.status(status).json(body);
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
