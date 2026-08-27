import React, { useState, useEffect, useRef } from 'react';

interface RichTextEditableProps {
  html: string;
  onChange: (html: string) => void;
  className?: string;
  tagName?: string;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  dir?: string;
  id?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
  // Select the entire current content the first time this field is
  // focused — for short fields (like a title) that start out holding a
  // real default value (e.g. "Untitled Essay", not just a placeholder),
  // a plain click drops the caret mid-text, so typing merges into the
  // default instead of replacing it.
  selectAllOnFocus?: boolean;
  // Native browser spellcheck. Defaults on — a real word processor always
  // spellchecks; this field was simply never set before.
  spellCheck?: boolean;
  // Called once per paste that contained recognizable Word/Google Docs
  // footnotes, with the extracted {id, content} pairs — the caller (an
  // Essay's canvas editor) is the one that owns footnotesData, so it has
  // to be the one to actually register them.
  onFootnotesFromPaste?: (footnotes: { id: string; content: string }[]) => void;
}

interface ExtractedFootnote { id: string; content: string; }

// A word processor's paste should never carry in Word/Google Docs's own
// styling (mso-* inline styles, font/color spans, conditional comments,
// etc) — only Adjung's own maroon/serif design language should ever apply.
// Strips everything down to a small allowed-tag set and drops every
// attribute except <a href>.
const PASTE_ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A', 'S', 'STRIKE', 'DEL', 'SUP', 'SUB', 'MARK']);

// Word and Google Docs both export footnotes as a reference/definition
// pair of anchors linked by a matching href="#x" / id-or-name="x": the
// reference sits inline (usually wrapped in <sup>), the definition lives
// in a block elsewhere in the same clipboard HTML. Without this step, the
// generic tag-stripping below would unwrap the <sup>/<div> wrappers and
// leave the footnote number as dead inline text with its body demoted to
// a stray trailing paragraph — the content survives, but it stops being a
// footnote. This finds each such pair, converts the reference into
// Adjung's own footnote-badge marker (the same element insertNote() in
// EntryRenderer.tsx creates), and removes the original definition block
// so it isn't left behind as body text.
function extractAndRewriteFootnotes(container: HTMLElement): ExtractedFootnote[] {
  const extracted: ExtractedFootnote[] = [];
  const MARKER_RE = /^\[?[0-9ivxlcIVXLC]{1,4}\]?\.?$/;

  Array.from(container.querySelectorAll('a[href^="#"]')).forEach(refAnchor => {
    const targetId = refAnchor.getAttribute('href')!.slice(1);
    if (!targetId || !MARKER_RE.test(refAnchor.textContent?.trim() || '')) return;

    let defAnchor: Element | null = null;
    try {
      defAnchor = container.querySelector(`a[name="${CSS.escape(targetId)}"], [id="${CSS.escape(targetId)}"]`);
    } catch {
      // Malformed id/name (unlikely, but paste content isn't trustworthy) — skip this one.
    }
    if (!defAnchor || defAnchor === refAnchor || defAnchor.contains(refAnchor) || refAnchor.contains(defAnchor)) return;

    const defBlock = defAnchor.closest('p, div, li') || defAnchor.parentElement;
    if (!defBlock || !container.contains(defBlock)) return;

    const defText = (defBlock.textContent || '').replace(/^\s*\[?[0-9ivxlcIVXLC]{1,4}\]?\.?\s*/, '').trim();
    if (!defText) return;

    const id = `fn-${Math.random().toString(36).slice(2, 10)}`;
    extracted.push({ id, content: defText });

    const badge = document.createElement('span');
    badge.className = 'footnote-badge';
    badge.setAttribute('data-id', id);
    badge.setAttribute('contenteditable', 'false');
    badge.textContent = '​';
    (refAnchor.closest('sup') || refAnchor).replaceWith(badge);

    defBlock.remove();
  });

  return extracted;
}

function sanitizePastedHtml(html: string): { html: string; footnotes: ExtractedFootnote[] } {
  const container = document.createElement('div');
  container.innerHTML = html;

  const footnotes = extractAndRewriteFootnotes(container);

  const clean = (node: Node) => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const el = child as HTMLElement;
      clean(el);
      const isFootnoteBadge = el.tagName === 'SPAN' && el.classList.contains('footnote-badge');
      if (isFootnoteBadge) return; // Leave the badge exactly as extractAndRewriteFootnotes built it.
      if (!PASTE_ALLOWED_TAGS.has(el.tagName)) {
        // Unwrap disallowed elements (e.g. Word's <span style="...">,
        // <o:p>, <div>) instead of dropping their text content.
        while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
        el.parentNode?.removeChild(el);
      } else {
        Array.from(el.attributes).forEach(attr => {
          if (!(el.tagName === 'A' && attr.name === 'href')) {
            el.removeAttribute(attr.name);
          }
        });
      }
    });
  };
  clean(container);
  return { html: container.innerHTML, footnotes };
}

export const RichTextEditable: React.FC<RichTextEditableProps> = ({
  html,
  onChange,
  className,
  tagName = 'div',
  placeholder,
  onKeyDown,
  dir,
  id,
  onContextMenu,
  selectAllOnFocus,
  spellCheck = true,
  onFootnotesFromPaste,
}) => {
  const editorRef = useRef<HTMLElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isFocused && html !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = html;
    }
  }, [html, isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const rawHtml = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');
    let insertable: string;
    let pastedFootnotes: ExtractedFootnote[] = [];
    if (rawHtml) {
      const result = sanitizePastedHtml(rawHtml);
      insertable = result.html;
      pastedFootnotes = result.footnotes;
    } else {
      insertable = plainText
        .split(/\r?\n+/)
        .map(line => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
        .join('');
    }
    document.execCommand('insertHTML', false, insertable);
    handleInput();
    if (pastedFootnotes.length && onFootnotesFromPaste) {
      onFootnotesFromPaste(pastedFootnotes);
    }
  };

  const Tag = tagName as any;
  return (
    <Tag
      ref={editorRef}
      id={id}
      contentEditable
      suppressContentEditableWarning
      className={className}
      onFocus={() => {
        setIsFocused(true);
        try {
          document.execCommand('defaultParagraphSeparator', false, 'p');
        } catch (e) {
          console.warn('[RichTextEditable] Failed to set defaultParagraphSeparator:', e);
        }
        if (selectAllOnFocus && editorRef.current) {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }}
      onBlur={() => {
        setIsFocused(false);
        handleInput();
      }}
      onInput={handleInput}
      onPaste={handlePaste}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
      placeholder={placeholder}
      dir={dir}
      spellCheck={spellCheck}
    />
  );
};
