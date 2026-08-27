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
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
      placeholder={placeholder}
      dir={dir}
    />
  );
};
