import fetch from 'node-fetch';

function parseInTheNews(text) {
  const items = [];
  const errors = [];
  
  if (!text) return { items, errors };
  
  const sections = text.split(/^[ \t]*(?:[-_—–―]{3,}|⸻+)[ \t]*$/gm);
  
  sections.forEach((section, index) => {
    const itemIndex = index + 1;
    const lines = section.split('\n');
    
    let desk = '';
    let title = '';
    let brief = '';
    let source = '';
    let url = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
        url = trimmed;
        return;
      }
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex <= 0) return;
      
      const key = trimmed.substring(0, colonIndex).trim().toLowerCase();
      const val = trimmed.substring(colonIndex + 1).trim();
      
      if (key === 'desk') {
        desk = val;
      } else if (key === 'title') {
        title = val;
      } else if (key === 'brief' || key === 'summary') {
        brief = val;
      } else if (key === 'source') {
        source = val;
      } else if (key === 'url') {
        url = val;
      }
    });
    
    if (!desk && !title && !brief && !source && !url) {
      return;
    }
    
    const missing = [];
    if (!desk) missing.push('Desk');
    if (!title) missing.push('Title');
    if (!brief) missing.push('Brief');
    if (!source) missing.push('Source');
    if (!url) missing.push('URL');
    
    if (missing.length > 0) {
      errors.push({
        index: itemIndex,
        error: `Missing mandatory field(s): ${missing.join(', ')}`
      });
      return;
    }
    
    items.push({
      desk,
      title,
      brief,
      source,
      url,
      rawIndex: itemIndex
    });
  });
  
  return { items, errors };
}

const url = "https://docs.google.com/document/d/1lgsNG0DCBFwPIi4wNhXhFNdGMhRMdtO1YJhaj1KM-Uc/export?format=txt";

async function test() {
  try {
    const res = await fetch(url);
    const text = await res.text();
    const { items, errors } = parseInTheNews(text);
    console.log('Items Count:', items.length);
    console.log('Errors:', errors);
    console.log('Parsed Items:', JSON.stringify(items, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
