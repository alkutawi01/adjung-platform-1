export default async function handler(req, res) {
  let { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Ensure the URL is valid HTTP/HTTPS
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
    
    // Clean and extract HTML text
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
      
    return res.status(200).json({ text: text.trim() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
