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
}

// A word processor's paste should never carry in Word/Google Docs's own
// styling (mso-* inline styles, font/color spans, conditional comments,
// etc) — only Adjung's own maroon/serif design language should ever apply.
// Strips everything down to a small allowed-tag set and drops every
// attribute except <a href>.
const PASTE_ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A']);

function sanitizePastedHtml(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;

  const clean = (node: Node) => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const el = child as HTMLElement;
      clean(el);
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
  return container.innerHTML;
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
    const insertable = rawHtml
      ? sanitizePastedHtml(rawHtml)
      : plainText
          .split(/\r?\n+/)
          .map(line => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
          .join('');
    document.execCommand('insertHTML', false, insertable);
    handleInput();
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
