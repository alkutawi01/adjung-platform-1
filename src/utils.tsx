import React from 'react';

/**
 * Detects if a given text block's dominant script is Arabic/Jawi.
 * Counting Arabic/Jawi script characters vs Latin LTR characters.
 */
export function isArabicText(text: string): boolean {
  if (!text) return false;
  // Regex pattern matching Arabic and Jawi characters
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const latinRegex = /[a-zA-Z]/g;

  const arabicMatches = text.match(arabicRegex) || [];
  const latinMatches = text.match(latinRegex) || [];

  if (arabicMatches.length === 0) return false;
  if (latinMatches.length === 0) return true;

  // Dominant script determines the direction of the block
  return arabicMatches.length > latinMatches.length;
}

type TokenType = 'TRIPLE_AST' | 'TRIPLE_UND' | 'DOUBLE_AST' | 'DOUBLE_UND' | 'SINGLE_AST' | 'SINGLE_UND' | 'TEXT';

interface Token {
  type: TokenType;
  text: string;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = text.length;
  let currentText = '';

  const flushText = () => {
    if (currentText) {
      tokens.push({ type: 'TEXT', text: currentText });
      currentText = '';
    }
  };

  while (i < len) {
    if (text.startsWith('***', i)) {
      flushText();
      tokens.push({ type: 'TRIPLE_AST', text: '***' });
      i += 3;
    } else if (text.startsWith('___', i)) {
      flushText();
      tokens.push({ type: 'TRIPLE_UND', text: '___' });
      i += 3;
    } else if (text.startsWith('**', i)) {
      flushText();
      tokens.push({ type: 'DOUBLE_AST', text: '**' });
      i += 2;
    } else if (text.startsWith('__', i)) {
      flushText();
      tokens.push({ type: 'DOUBLE_UND', text: '__' });
      i += 2;
    } else if (text.startsWith('*', i)) {
      flushText();
      tokens.push({ type: 'SINGLE_AST', text: '*' });
      i += 1;
    } else if (text.startsWith('_', i)) {
      flushText();
      tokens.push({ type: 'SINGLE_UND', text: '_' });
      i += 1;
    } else {
      currentText += text[i];
      i += 1;
    }
  }
  flushText();
  return tokens;
}

function parseTokens(tokens: Token[], keyPrefix: string = 'token'): React.ReactNode[] {
  let i = 0;
  const result: React.ReactNode[] = [];
  let keyIdx = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'TEXT') {
      result.push(<React.Fragment key={`${keyPrefix}-${keyIdx++}`}>{token.text}</React.Fragment>);
      i++;
      continue;
    }

    // It's a formatting marker: TRIPLE_AST, TRIPLE_UND, DOUBLE_AST, DOUBLE_UND, SINGLE_AST, SINGLE_UND
    // Let's search for a matching closing marker of the same type.
    let matchIdx = -1;
    for (let j = i + 1; j < tokens.length; j++) {
      if (tokens[j].type === token.type) {
        matchIdx = j;
        break;
      }
    }

    if (matchIdx !== -1) {
      // We found a matching closing marker!
      // The tokens between i and matchIdx are the inner content.
      const innerTokens = tokens.slice(i + 1, matchIdx);
      const innerParsed = parseTokens(innerTokens, `${keyPrefix}-${keyIdx++}`);

      const elementKey = `${keyPrefix}-${keyIdx++}`;
      if (token.type === 'TRIPLE_AST' || token.type === 'TRIPLE_UND') {
        result.push(
          <strong key={elementKey} className="font-bold text-[#111111]">
            <em className="italic">{innerParsed}</em>
          </strong>
        );
      } else if (token.type === 'DOUBLE_AST' || token.type === 'DOUBLE_UND') {
        result.push(
          <strong key={elementKey} className="font-bold text-[#111111]">
            {innerParsed}
          </strong>
        );
      } else if (token.type === 'SINGLE_AST' || token.type === 'SINGLE_UND') {
        result.push(
          <em key={elementKey} className="italic">
            {innerParsed}
          </em>
        );
      }
      i = matchIdx + 1;
    } else {
      // No matching closing marker found. Treat this marker as literal plain text!
      result.push(<React.Fragment key={`${keyPrefix}-${keyIdx++}`}>{token.text}</React.Fragment>);
      i++;
    }
  }

  return result;
}

/**
 * Semantic Inline Markdown Parser:
 * Replaces Markdown styles with clean inline HTML/React elements without leakage.
 * Processes footers and inline elements recursively and safely.
 */
export function parseInlineFormatting(text: string): React.ReactNode {
  if (!text) return '';

  // First split by standard footnote syntax: [^1]
  const fnRegex = /\[\^(\d+)\]/g;
  const parts: { type: 'text' | 'fn'; content: string; key: string }[] = [];
  let lastIndex = 0;
  let match;
  let keyIdx = 0;

  while ((match = fnRegex.exec(text)) !== null) {
    const index = match.index;
    const num = match[1];

    if (index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, index), key: `txt-${keyIdx++}` });
    }

    parts.push({ type: 'fn', content: num, key: `fn-${num}-${keyIdx++}` });
    lastIndex = fnRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex), key: `txt-${keyIdx++}` });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content: text, key: 'txt-all' });
  }

  return parts.map((part) => {
    if (part.type === 'fn') {
      return (
        <a
          key={part.key}
          href={`#footnote-dest-${part.content}`}
          className="footnote-ref text-[10px] font-medium align-super select-none hover:text-adjung-maroon font-sans px-0.5"
          title={`Jump to footnote ${part.content}`}
        >
          [{part.content}]
        </a>
      );
    }

    const subText = part.content;
    const tokens = tokenize(subText);
    return parseTokens(tokens, part.key);
  });
}

/**
 * Generates an elegant and unique canonical URL for a given writer and post slug.
 */
export function generateCanonicalUrl(penName: string, type: string, slug: string): string {
  const authorSubdomain = penName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://${authorSubdomain}.adjung.com/${type.toLowerCase()}/${slug}`;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface LatinQuoteBlock {
  type: 'latin-quote';
  text: string;
}

export interface ArabicQuoteBlock {
  type: 'arabic-quote';
  arabic: string;
  translation?: string;
}

export type ContentBlock = ParagraphBlock | LatinQuoteBlock | ArabicQuoteBlock;

/**
 * Parses raw text content into an array of structured ContentBlocks.
 * Handles both the new explicit XML <quote> tags and legacy Markdown blockquotes.
 */
export function parseContentToBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  if (!content) return [];

  // If the content contains explicit quote tags, parse them using a structured tag scanner
  if (content.includes('<quote')) {
    let remaining = content;
    while (remaining.length > 0) {
      const quoteStartIdx = remaining.indexOf('<quote');
      if (quoteStartIdx === -1) {
        // No more quotes, parse remaining text as standard paragraphs
        const paras = remaining.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        for (const p of paras) {
          blocks.push({ type: 'paragraph', text: p });
        }
        break;
      }

      // Process any paragraphs preceding the quote
      if (quoteStartIdx > 0) {
        const preceding = remaining.substring(0, quoteStartIdx);
        const paras = preceding.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        for (const p of paras) {
          blocks.push({ type: 'paragraph', text: p });
        }
      }

      // Process the quote block
      const tagEndIdx = remaining.indexOf('>', quoteStartIdx);
      if (tagEndIdx === -1) {
        // Malformed, treat remaining as standard paragraphs
        const paras = remaining.substring(quoteStartIdx).split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        for (const p of paras) {
          blocks.push({ type: 'paragraph', text: p });
        }
        break;
      }

      const tagText = remaining.substring(quoteStartIdx, tagEndIdx + 1);
      const quoteEndIdx = remaining.indexOf('</quote>', tagEndIdx);
      if (quoteEndIdx === -1) {
        // Malformed, treat remaining as standard paragraphs
        const paras = remaining.substring(quoteStartIdx).split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        for (const p of paras) {
          blocks.push({ type: 'paragraph', text: p });
        }
        break;
      }

      const quoteInner = remaining.substring(tagEndIdx + 1, quoteEndIdx).trim();
      const typeMatch = tagText.match(/type="([^"]+)"/);
      const quoteType = typeMatch ? typeMatch[1] : 'latin';

      if (quoteType === 'arabic') {
        const arStart = quoteInner.indexOf('<arabic>');
        const arEnd = quoteInner.indexOf('</arabic>');
        let arabicVal = '';
        if (arStart !== -1 && arEnd !== -1) {
          arabicVal = quoteInner.substring(arStart + 8, arEnd).trim();
        } else {
          arabicVal = quoteInner;
        }

        const transStart = quoteInner.indexOf('<translation>');
        const transEnd = quoteInner.indexOf('</translation>');
        let translationVal: string | undefined = undefined;
        if (transStart !== -1 && transEnd !== -1) {
          translationVal = quoteInner.substring(transStart + 13, transEnd).trim();
        }

        blocks.push({
          type: 'arabic-quote',
          arabic: arabicVal,
          translation: translationVal
        });
      } else {
        // Latin Quote
        const textStart = quoteInner.indexOf('<text>');
        const textEnd = quoteInner.indexOf('</text>');
        let textVal = '';
        if (textStart !== -1 && textEnd !== -1) {
          textVal = quoteInner.substring(textStart + 6, textEnd).trim();
        } else {
          textVal = quoteInner;
        }

        blocks.push({
          type: 'latin-quote',
          text: textVal
        });
      }

      remaining = remaining.substring(quoteEndIdx + 8);
    }
    return blocks;
  }

  // Legacy parser: split content by paragraphs and parse > markers
  const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  for (const p of paragraphs) {
    if (p.startsWith('>')) {
      const lines = p.split('\n').map(line => {
        const l = line.trim();
        return l.startsWith('>') ? l.substring(1).trim() : l;
      }).filter(Boolean);

      const hasArabic = lines.some(line => isArabicText(line));
      if (hasArabic) {
        // Separate Arabic from non-Arabic (translation)
        const arLines: string[] = [];
        const transLines: string[] = [];
        let readingArabic = true;

        for (const line of lines) {
          if (readingArabic) {
            if (isArabicText(line)) {
              arLines.push(line);
            } else {
              readingArabic = false;
              transLines.push(line);
            }
          } else {
            transLines.push(line);
          }
        }

        blocks.push({
          type: 'arabic-quote',
          arabic: arLines.join('\n'),
          translation: transLines.length > 0 ? transLines.join('\n') : undefined
        });
      } else {
        blocks.push({
          type: 'latin-quote',
          text: lines.join('\n')
        });
      }
    } else {
      blocks.push({
        type: 'paragraph',
        text: p
      });
    }
  }

  return blocks;
}

/**
 * Serializes ContentBlocks back to a raw text string for persistence.
 */
export function serializeBlocks(blocks: ContentBlock[]): string {
  return blocks.map(block => {
    if (block.type === 'paragraph') {
      return block.text;
    }
    if (block.type === 'latin-quote') {
      return `<quote type="latin"><text>${block.text}</text></quote>`;
    }
    if (block.type === 'arabic-quote') {
      const trans = block.translation ? `\n  <translation>${block.translation}</translation>` : '';
      return `<quote type="arabic">\n  <arabic>${block.arabic}</arabic>${trans}\n</quote>`;
    }
    return '';
  }).join('\n\n');
}

/**
 * Generates a clean random UUID for local database records.
 */
export function generateUUID(): string {
  return 'entry-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
