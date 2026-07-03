import React, { useState, useEffect, useRef } from 'react';
import { Entry, EntryType, EntryStatus, EntryVisibility, Citation, Revision, VectorStroke } from '../types';
import { SignatureRenderer } from './SignatureRenderer';
import { isArabicText, parseInlineFormatting, ContentBlock, parseContentToBlocks, DocumentExporter, HeadingBlock } from '../utils';
import { Tag, Calendar, Globe, Lock, Trash2, Plus, Info, Settings, BookOpen, ArrowUp, ArrowDown, Copy } from 'lucide-react';

interface EntryRendererProps {
  entry: Entry;
  mode: 'view' | 'edit';
  onSave?: (updatedEntry: Entry) => void;
  onDelete?: (id: string) => void;
  authorName: string;
  authorSignature: string;
  authorSignatureStrokes?: VectorStroke[][];
}

export function EntryRenderer({
  entry,
  mode,
  onSave,
  onDelete,
  authorName,
  authorSignature,
  authorSignatureStrokes
}: EntryRendererProps) {
  const [title, setTitle] = useState(entry.title);
  const [contentType, setContentType] = useState<EntryType>(entry.contentType);
  const [status, setStatus] = useState<EntryStatus>(entry.status);
  const [visibility, setVisibility] = useState<EntryVisibility>(entry.visibility);
  const [tags, setTags] = useState<string[]>(entry.tags);
  const [newTag, setNewTag] = useState('');
  const [slug, setSlug] = useState(entry.slug);
  const [showSettings, setShowSettings] = useState(false);
  const [activeQuoteInsert, setActiveQuoteInsert] = useState<'latin' | 'arabic' | null>(null);
  const [excerpt, setExcerpt] = useState(entry.excerpt || '');
  const [featuredImage, setFeaturedImage] = useState(entry.featuredImage || '');
  const [revisions, setRevisions] = useState<Revision[]>(entry.revisions || []);
  const [showXmlView, setShowXmlView] = useState(false);
  const [citations, setCitations] = useState<Citation[]>(entry.citations || []);
  const [referenceSortOrder, setReferenceSortOrder] = useState<'alphabetical' | 'appearance'>(entry.referenceSortOrder || 'alphabetical');

  // Visual Builders States
  const [activeTableInsert, setActiveTableInsert] = useState(false);
  const [activeCitationInsert, setActiveCitationInsert] = useState(false);
  const [activeCalloutInsert, setActiveCalloutInsert] = useState(false);

  // Table Grid Builders States
  const [tableHeaders, setTableHeaders] = useState<string[]>(['Header 1', 'Header 2', 'Header 3']);
  const [tableData, setTableData] = useState<string[][]>([
    ['Cell 1.1', 'Cell 1.2', 'Cell 1.3'],
    ['Cell 2.1', 'Cell 2.2', 'Cell 2.3']
  ]);
  const [tableAlignments, setTableAlignments] = useState<Array<'left' | 'center' | 'right'>>(['left', 'left', 'left']);

  // For Essay:
  const [footnotes, setFootnotes] = useState<string[]>(entry.footnotes || []);

  // For Article and general content:
  const [content, setContent] = useState(entry.content);
  // Split content into paragraphs to align with margin notes
  const [paragraphs, setParagraphs] = useState<string[]>(() => {
    const parts = entry.content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    return parts.length > 0 ? parts : [entry.content];
  });
  const [marginNotes, setMarginNotes] = useState<{ [key: number]: string }>(entry.marginNotes || {});
  const [prevEntryId, setPrevEntryId] = useState(entry.id);

  // Toast notifications for action feedback:
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Sprint 1 Typing Stats & Autosave state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [activeTextareaIdx, setActiveTextareaIdx] = useState<number | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef({ content, footnotes, marginNotes, contentType, status, visibility, tags, slug, title, excerpt, featuredImage, revisions, citations, referenceSortOrder });

  useEffect(() => {
    stateRef.current = { content, footnotes, marginNotes, contentType, status, visibility, tags, slug, title, excerpt, featuredImage, revisions, citations, referenceSortOrder };
  }, [content, footnotes, marginNotes, contentType, status, visibility, tags, slug, title, excerpt, featuredImage, revisions, citations, referenceSortOrder]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setToastVisible(true);
  };

  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toastVisible]);

  // Update states when entry changes
  useEffect(() => {
    setTitle(entry.title);
    setContentType(entry.contentType);
    setStatus(entry.status);
    setVisibility(entry.visibility);
    setTags(entry.tags);
    setSlug(entry.slug);
    setFootnotes(entry.footnotes || []);
    setContent(entry.content);
    setMarginNotes(entry.marginNotes || {});
    setExcerpt(entry.excerpt || '');
    setFeaturedImage(entry.featuredImage || '');
    setRevisions(entry.revisions || []);
    setCitations(entry.citations || []);
    setReferenceSortOrder(entry.referenceSortOrder || 'alphabetical');

    // Only re-split content if a completely different entry was loaded!
    if (entry.id !== prevEntryId) {
      setPrevEntryId(entry.id);
      const parts = entry.content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
      setParagraphs(parts.length > 0 ? parts : [entry.content]);
    }
  }, [entry, prevEntryId]);

  // Synchronize paragraphs array from content string (only for Note and Essay)
  useEffect(() => {
    if (contentType !== 'Article') {
      const parts = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
      setParagraphs(parts.length > 0 ? parts : [content]);
    }
  }, [content, contentType]);

  // Document Stats Helpers
  const getWordCount = (text: string) => {
    if (!text) return 0;
    const cleanText = text.trim();
    if (!cleanText) return 0;
    return cleanText.split(/\s+/).filter(Boolean).length;
  };

  const getCharCount = (text: string) => {
    return text ? text.length : 0;
  };

  const getReadingTime = (text: string) => {
    const words = getWordCount(text);
    const minutes = Math.ceil(words / 200);
    return minutes === 1 ? '1 min read' : `${minutes} min read`;
  };

  const getFullContentString = () => {
    if (contentType === 'Article') {
      return paragraphs.join('\n\n');
    }
    return content;
  };

  // Keyboard Formatting Inserters
  const insertMarkdownText = (beforeText: string, afterText: string = '') => {
    const id = activeTextareaIdx !== null ? `editorial-content-textarea-${activeTextareaIdx}` : 'editorial-content-textarea';
    const textarea = document.getElementById(id) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    const selectedText = val.substring(start, end);
    const inserted = beforeText + selectedText + afterText;
    const newValue = val.substring(0, start) + inserted + val.substring(end);

    if (contentType === 'Article' && activeTextareaIdx !== null) {
      handleContentChange(activeTextareaIdx, newValue);
    } else {
      setContent(newValue);
      triggerSave(newValue, footnotes, marginNotes);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + beforeText.length, start + beforeText.length + selectedText.length);
    }, 50);
  };

  const insertLinePrefix = (prefix: string) => {
    const id = activeTextareaIdx !== null ? `editorial-content-textarea-${activeTextareaIdx}` : 'editorial-content-textarea';
    const textarea = document.getElementById(id) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const val = textarea.value;
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const before = val.substring(0, lineStart);
    const after = val.substring(lineStart);

    const newValue = before + prefix + after;
    if (contentType === 'Article' && activeTextareaIdx !== null) {
      handleContentChange(activeTextareaIdx, newValue);
    } else {
      setContent(newValue);
      triggerSave(newValue, footnotes, marginNotes);
    }

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + prefix.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 50);
  };

  // Global shortcut handler for Bold (Ctrl+B), Italic (Ctrl+I), Headings (Ctrl+Shift+1/2/3), Inline Code (Ctrl+Shift+K)
  useEffect(() => {
    if (mode !== 'edit') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isB = (event.key === 'b' || event.key === 'B') && (event.ctrlKey || event.metaKey);
      const isI = (event.key === 'i' || event.key === 'I') && (event.ctrlKey || event.metaKey);
      const isH1 = event.shiftKey && (event.key === '!' || event.key === '1') && (event.ctrlKey || event.metaKey);
      const isH2 = event.shiftKey && (event.key === '@' || event.key === '2') && (event.ctrlKey || event.metaKey);
      const isH3 = event.shiftKey && (event.key === '#' || event.key === '3') && (event.ctrlKey || event.metaKey);
      const isCode = event.shiftKey && (event.key === 'k' || event.key === 'K') && (event.ctrlKey || event.metaKey);

      if (!isB && !isI && !isH1 && !isH2 && !isH3 && !isCode) return;

      const activeEl = document.activeElement;
      if (!activeEl) return;

      const isTextArea = activeEl instanceof HTMLTextAreaElement;
      const isInput = activeEl instanceof HTMLInputElement;
      if (!isTextArea && !isInput) return;

      const inputEl = activeEl as HTMLTextAreaElement | HTMLInputElement;
      
      const start = inputEl.selectionStart;
      const end = inputEl.selectionEnd;
      if (start === null || end === null) return;

      event.preventDefault();

      const value = inputEl.value;

      const updateInputValue = (val: string, newStart: number, newEnd: number) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(inputEl),
          'value'
        )?.set;
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(inputEl, val);
        } else {
          inputEl.value = val;
        }

        inputEl.setSelectionRange(newStart, newEnd);
        const inputEvent = new Event('input', { bubbles: true });
        inputEl.dispatchEvent(inputEvent);
      };

      if (isB || isI) {
        const selectedText = value.substring(start, end);
        const marker = isB ? '**' : '*';
        let newValue = '';
        let newStart = start;
        let newEnd = end;

        if (selectedText.startsWith(marker) && selectedText.endsWith(marker) && selectedText.length >= marker.length * 2) {
          const unwrapped = selectedText.substring(marker.length, selectedText.length - marker.length);
          newValue = value.substring(0, start) + unwrapped + value.substring(end);
          newStart = start;
          newEnd = start + unwrapped.length;
        } else {
          const wrapped = marker + selectedText + marker;
          newValue = value.substring(0, start) + wrapped + value.substring(end);
          newStart = start + marker.length;
          newEnd = end + marker.length;
        }
        updateInputValue(newValue, newStart, newEnd);
      } else if (isH1 || isH2 || isH3) {
        const level = isH1 ? 1 : isH2 ? 2 : 3;
        const prefix = '#'.repeat(level) + ' ';
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', start);
        const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
        const lineText = value.substring(lineStart, actualLineEnd);

        let newLineText = lineText;
        if (lineText.startsWith(prefix)) {
          newLineText = lineText.substring(prefix.length);
        } else {
          const cleanLine = lineText.replace(/^#{1,3}\s+/, '');
          newLineText = prefix + cleanLine;
        }

        const newValue = value.substring(0, lineStart) + newLineText + value.substring(actualLineEnd);
        const newCursorPos = lineStart + newLineText.length;
        updateInputValue(newValue, newCursorPos, newCursorPos);
      } else if (isCode) {
        const selectedText = value.substring(start, end);
        const marker = '`';
        let newValue = '';
        let newStart = start;
        let newEnd = end;

        if (selectedText.startsWith(marker) && selectedText.endsWith(marker)) {
          const unwrapped = selectedText.substring(1, selectedText.length - 1);
          newValue = value.substring(0, start) + unwrapped + value.substring(end);
          newStart = start;
          newEnd = start + unwrapped.length;
        } else {
          const wrapped = marker + selectedText + marker;
          newValue = value.substring(0, start) + wrapped + value.substring(end);
          newStart = start + 1;
          newEnd = end + 1;
        }
        updateInputValue(newValue, newStart, newEnd);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode]);

  // Debounced Autosave engine
  const triggerAutosave = (
    updatedContent = stateRef.current.content,
    updatedFootnotes = stateRef.current.footnotes,
    updatedMarginNotes = stateRef.current.marginNotes,
    updatedType = stateRef.current.contentType,
    updatedStatus = stateRef.current.status,
    updatedVisibility = stateRef.current.visibility,
    updatedTags = stateRef.current.tags,
    updatedSlug = stateRef.current.slug,
    updatedTitle = stateRef.current.title,
    updatedExcerpt = stateRef.current.excerpt,
    updatedFeaturedImage = stateRef.current.featuredImage,
    updatedRevisions = stateRef.current.revisions,
    updatedCitations = stateRef.current.citations,
    updatedReferenceSortOrder = stateRef.current.referenceSortOrder
  ) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (!onSave) return;
      try {
        const savedEntry: Entry = {
          ...entry,
          title: updatedTitle,
          contentType: updatedType,
          status: updatedStatus,
          visibility: updatedVisibility,
          tags: updatedTags,
          slug: updatedSlug,
          content: updatedContent,
          footnotes: updatedType === 'Essay' ? updatedFootnotes : undefined,
          marginNotes: updatedType === 'Article' ? updatedMarginNotes : undefined,
          excerpt: updatedExcerpt,
          featuredImage: updatedFeaturedImage,
          revisions: updatedRevisions,
          citations: updatedCitations,
          referenceSortOrder: updatedReferenceSortOrder,
          publishedDate: updatedStatus === 'Published' ? (entry.publishedDate || new Date().toISOString()) : null,
          updatedDate: new Date().toISOString(),
          canonicalUrl: `https://${authorName.toLowerCase().replace(/\s+/g, '')}.adjung.com/${updatedType.toLowerCase()}/${updatedSlug}`
        };
        onSave(savedEntry);
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (e) {
        setSaveStatus('error');
      }
    }, 1500);
  };

  const forceImmediateSave = (updatedStatus = status, updatedVisibility = visibility, customRevisions?: Revision[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (!onSave) return;
    try {
      setSaveStatus('saving');
      
      let nextRevisions = customRevisions || stateRef.current.revisions;
      if (!customRevisions) {
        // Create manual action snapshot
        const newRev: Revision = {
          id: generateUUID(),
          timestamp: new Date().toISOString(),
          title: stateRef.current.title,
          content: stateRef.current.content,
          excerpt: stateRef.current.excerpt,
          featuredImage: stateRef.current.featuredImage,
          footnotes: stateRef.current.contentType === 'Essay' ? stateRef.current.footnotes : undefined,
          marginNotes: stateRef.current.contentType === 'Article' ? stateRef.current.marginNotes : undefined,
          status: updatedStatus,
          visibility: updatedVisibility,
          tags: stateRef.current.tags,
          slug: stateRef.current.slug,
          citations: stateRef.current.citations,
          referenceSortOrder: stateRef.current.referenceSortOrder
        };
        nextRevisions = [...nextRevisions, newRev];
        setRevisions(nextRevisions);
      }

      const savedEntry: Entry = {
        ...entry,
        title: stateRef.current.title,
        contentType: stateRef.current.contentType,
        status: updatedStatus,
        visibility: updatedVisibility,
        tags: stateRef.current.tags,
        slug: stateRef.current.slug,
        content: stateRef.current.content,
        footnotes: stateRef.current.contentType === 'Essay' ? stateRef.current.footnotes : undefined,
        marginNotes: stateRef.current.contentType === 'Article' ? stateRef.current.marginNotes : undefined,
        excerpt: stateRef.current.excerpt,
        featuredImage: stateRef.current.featuredImage,
        revisions: nextRevisions,
        citations: stateRef.current.citations,
        referenceSortOrder: stateRef.current.referenceSortOrder,
        publishedDate: updatedStatus === 'Published' ? (entry.publishedDate || new Date().toISOString()) : null,
        updatedDate: new Date().toISOString(),
        canonicalUrl: `https://${authorName.toLowerCase().replace(/\s+/g, '')}.adjung.com/${stateRef.current.contentType.toLowerCase()}/${stateRef.current.slug}`
      };
      onSave(savedEntry);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const triggerSave = (
    updatedContent: string,
    updatedFootnotes: string[],
    updatedMarginNotes: { [key: number]: string },
    updatedType = contentType,
    updatedStatus = status,
    updatedVisibility = visibility,
    updatedTags = tags,
    updatedSlug = slug,
    updatedTitle = title,
    updatedExcerpt = excerpt,
    updatedFeaturedImage = featuredImage,
    updatedRevisions = revisions,
    updatedCitations = citations,
    updatedReferenceSortOrder = referenceSortOrder
  ) => {
    triggerAutosave(
      updatedContent,
      updatedFootnotes,
      updatedMarginNotes,
      updatedType,
      updatedStatus,
      updatedVisibility,
      updatedTags,
      updatedSlug,
      updatedTitle,
      updatedExcerpt,
      updatedFeaturedImage,
      updatedRevisions,
      updatedCitations,
      updatedReferenceSortOrder
    );
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (mode === 'edit') {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
      triggerSave(content, footnotes, marginNotes, contentType, status, visibility, tags, generatedSlug, val, excerpt, featuredImage);
    }
  };

  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setExcerpt(val);
    triggerSave(content, footnotes, marginNotes, contentType, status, visibility, tags, slug, title, val, featuredImage);
  };

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFeaturedImage(val);
    triggerSave(content, footnotes, marginNotes, contentType, status, visibility, tags, slug, title, excerpt, val);
  };

  const generateUUID = () => {
    return 'rev-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleCreateManualRevision = () => {
    const newRev: Revision = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      title: stateRef.current.title,
      content: stateRef.current.content,
      excerpt: stateRef.current.excerpt,
      featuredImage: stateRef.current.featuredImage,
      footnotes: stateRef.current.contentType === 'Essay' ? stateRef.current.footnotes : undefined,
      marginNotes: stateRef.current.contentType === 'Article' ? stateRef.current.marginNotes : undefined,
      status: stateRef.current.status,
      visibility: stateRef.current.visibility,
      tags: stateRef.current.tags,
      slug: stateRef.current.slug
    };

    const updated = [...revisions, newRev];
    setRevisions(updated);
    forceImmediateSave(status, visibility, updated);
    showToast('Revision snapshot captured', 'success');
  };

  const handleRestoreRevision = (rev: Revision) => {
    const confirmRestore = window.confirm(
      `Are you sure you want to restore revision from ${new Date(rev.timestamp).toLocaleString()}? Your current edits will be saved as a backup snapshot.`
    );
    if (!confirmRestore) return;

    // 1. Create a backup snapshot of current state
    const backupRev: Revision = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      title: stateRef.current.title,
      content: stateRef.current.content,
      excerpt: stateRef.current.excerpt,
      featuredImage: stateRef.current.featuredImage,
      footnotes: stateRef.current.contentType === 'Essay' ? stateRef.current.footnotes : undefined,
      marginNotes: stateRef.current.contentType === 'Article' ? stateRef.current.marginNotes : undefined,
      status: stateRef.current.status,
      visibility: stateRef.current.visibility,
      tags: stateRef.current.tags,
      slug: stateRef.current.slug
    };

    // 2. Restore states
    setTitle(rev.title);
    setContent(rev.content);
    setExcerpt(rev.excerpt || '');
    setFeaturedImage(rev.featuredImage || '');
    setFootnotes(rev.footnotes || []);
    setMarginNotes(rev.marginNotes || {});
    setStatus(rev.status);
    setVisibility(rev.visibility);
    setTags(rev.tags);
    setSlug(rev.slug);

    if (contentType === 'Article') {
      const parts = rev.content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
      setParagraphs(parts.length > 0 ? parts : [rev.content]);
    }

    const updatedRevisions = [...revisions, backupRev];
    setRevisions(updatedRevisions);

    // Save immediately
    const savedEntry: Entry = {
      ...entry,
      title: rev.title,
      contentType,
      status: rev.status,
      visibility: rev.visibility,
      tags: rev.tags,
      slug: rev.slug,
      content: rev.content,
      footnotes: contentType === 'Essay' ? rev.footnotes : undefined,
      marginNotes: contentType === 'Article' ? rev.marginNotes : undefined,
      excerpt: rev.excerpt,
      featuredImage: rev.featuredImage,
      revisions: updatedRevisions,
      publishedDate: rev.status === 'Published' ? (entry.publishedDate || new Date().toISOString()) : null,
      updatedDate: new Date().toISOString(),
      canonicalUrl: `https://${authorName.toLowerCase().replace(/\s+/g, '')}.adjung.com/${contentType.toLowerCase()}/${rev.slug}`
    };

    if (onSave) {
      onSave(savedEntry);
    }
    setSaveStatus('saved');
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    showToast('Revision restored successfully', 'success');
  };

  const getXmlString = () => {
    return DocumentExporter.exportToXml(
      {
        ...entry,
        title,
        contentType,
        content: getFullContentString(),
        excerpt,
        tags,
        slug,
        citations,
        referenceSortOrder
      },
      authorName
    );
  };

  const handleAddCitation = (cit: Omit<Citation, 'id'>) => {
    const newCitation: Citation = {
      ...cit,
      id: 'cite-' + Math.random().toString(36).substring(2, 11)
    };
    const updated = [...citations, newCitation];
    setCitations(updated);
    triggerSave(content, footnotes, marginNotes, contentType, status, visibility, tags, slug, title, excerpt, featuredImage, revisions, updated);
    showToast('Citation registered', 'success');
  };

  const handleDeleteCitation = (id: string) => {
    const updated = citations.filter(c => c.id !== id);
    setCitations(updated);
    triggerSave(content, footnotes, marginNotes, contentType, status, visibility, tags, slug, title, excerpt, featuredImage, revisions, updated);
    showToast('Citation removed', 'info');
  };

  const handleContentChange = (index: number, newText: string) => {
    const updatedParagraphs = [...paragraphs];
    updatedParagraphs[index] = newText;
    setParagraphs(updatedParagraphs);
    const newContentString = updatedParagraphs.join('\n\n');
    setContent(newContentString);
    triggerSave(newContentString, footnotes, marginNotes);
  };

  const handleBlockTypeChange = (index: number, newType: 'paragraph' | 'latin-quote' | 'arabic-quote') => {
    let serialized = '';
    if (newType === 'paragraph') {
      serialized = 'New paragraph text.';
    } else if (newType === 'latin-quote') {
      serialized = '<quote type="latin"><text>New Latin quote text.</text></quote>';
    } else if (newType === 'arabic-quote') {
      serialized = '<quote type="arabic">\n  <arabic>اكتب النص العربي هنا</arabic>\n</quote>';
    }
    handleContentChange(index, serialized);
  };

  const insertQuoteAtCursor = (quoteText: string) => {
    const textarea = document.getElementById('editorial-content-textarea') as HTMLTextAreaElement;
    if (!textarea) {
      const updated = content ? `${content}\n\n${quoteText}` : quoteText;
      setContent(updated);
      triggerSave(updated, footnotes, marginNotes);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    const before = val.substring(0, start);
    const after = val.substring(end);

    const spacingBefore = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const spacingAfter = after && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : '';

    const inserted = spacingBefore + quoteText + spacingAfter;
    const newValue = before + inserted + after;

    setContent(newValue);
    triggerSave(newValue, footnotes, marginNotes);

    setTimeout(() => {
      textarea.focus();
      const cursorIdx = start + inserted.length;
      textarea.setSelectionRange(cursorIdx, cursorIdx);
    }, 50);
  };

  const handleAddParagraph = () => {
    const updatedParagraphs = [...paragraphs, ''];
    setParagraphs(updatedParagraphs);
    const newContentString = updatedParagraphs.join('\n\n');
    setContent(newContentString);
    triggerSave(newContentString, footnotes, marginNotes);
  };

  const handleRemoveParagraph = (index: number) => {
    if (paragraphs.length <= 1) return;
    const updatedParagraphs = paragraphs.filter((_, i) => i !== index);
    setParagraphs(updatedParagraphs);
    const newContentString = updatedParagraphs.join('\n\n');
    setContent(newContentString);

    // Shift margin notes as well
    const newMarginNotes: { [key: number]: string } = {};
    Object.keys(marginNotes).forEach(key => {
      const k = parseInt(key);
      if (k < index) {
        newMarginNotes[k] = marginNotes[k];
      } else if (k > index) {
        newMarginNotes[k - 1] = marginNotes[k];
      }
    });
    setMarginNotes(newMarginNotes);

    triggerSave(newContentString, footnotes, newMarginNotes);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updatedParagraphs = [...paragraphs];
    const temp = updatedParagraphs[index];
    updatedParagraphs[index] = updatedParagraphs[index - 1];
    updatedParagraphs[index - 1] = temp;
    
    // Also swap margin notes!
    const updatedMarginNotes = { ...marginNotes };
    const tempNote = updatedMarginNotes[index];
    if (updatedMarginNotes[index - 1] !== undefined) {
      updatedMarginNotes[index] = updatedMarginNotes[index - 1];
    } else {
      delete updatedMarginNotes[index];
    }
    if (tempNote !== undefined) {
      updatedMarginNotes[index - 1] = tempNote;
    } else {
      delete updatedMarginNotes[index - 1];
    }

    setParagraphs(updatedParagraphs);
    setMarginNotes(updatedMarginNotes);
    const newContentString = updatedParagraphs.join('\n\n');
    setContent(newContentString);
    triggerSave(newContentString, footnotes, updatedMarginNotes);
  };

  const handleMoveDown = (index: number) => {
    if (index === paragraphs.length - 1) return;
    const updatedParagraphs = [...paragraphs];
    const temp = updatedParagraphs[index];
    updatedParagraphs[index] = updatedParagraphs[index + 1];
    updatedParagraphs[index + 1] = temp;

    // Also swap margin notes!
    const updatedMarginNotes = { ...marginNotes };
    const tempNote = updatedMarginNotes[index];
    if (updatedMarginNotes[index + 1] !== undefined) {
      updatedMarginNotes[index] = updatedMarginNotes[index + 1];
    } else {
      delete updatedMarginNotes[index];
    }
    if (tempNote !== undefined) {
      updatedMarginNotes[index + 1] = tempNote;
    } else {
      delete updatedMarginNotes[index + 1];
    }

    setParagraphs(updatedParagraphs);
    setMarginNotes(updatedMarginNotes);
    const newContentString = updatedParagraphs.join('\n\n');
    setContent(newContentString);
    triggerSave(newContentString, footnotes, updatedMarginNotes);
  };

  const handleDuplicateParagraph = (index: number) => {
    const updatedParagraphs = [...paragraphs];
    const blockToCopy = updatedParagraphs[index];
    updatedParagraphs.splice(index + 1, 0, blockToCopy);

    // Also copy margin note to the duplicated block, and shift any subsequent notes
    const updatedMarginNotes: { [key: number]: string } = {};
    Object.keys(marginNotes).forEach(key => {
      const k = parseInt(key);
      if (k <= index) {
        updatedMarginNotes[k] = marginNotes[k];
      } else {
        updatedMarginNotes[k + 1] = marginNotes[k];
      }
    });
    // Duplicate the margin note if it exists
    if (marginNotes[index] !== undefined) {
      updatedMarginNotes[index + 1] = marginNotes[index];
    }

    setParagraphs(updatedParagraphs);
    setMarginNotes(updatedMarginNotes);
    const newContentString = updatedParagraphs.join('\n\n');
    setContent(newContentString);
    triggerSave(newContentString, footnotes, updatedMarginNotes);
  };

  const handleInsertBelow = (index: number) => {
    const updatedParagraphs = [...paragraphs];
    updatedParagraphs.splice(index + 1, 0, '');

    // Shift margin notes for any subsequent blocks
    const updatedMarginNotes: { [key: number]: string } = {};
    Object.keys(marginNotes).forEach(key => {
      const k = parseInt(key);
      if (k <= index) {
        updatedMarginNotes[k] = marginNotes[k];
      } else {
        updatedMarginNotes[k + 1] = marginNotes[k];
      }
    });

    setParagraphs(updatedParagraphs);
    setMarginNotes(updatedMarginNotes);
    const newContentString = updatedParagraphs.join('\n\n');
    setContent(newContentString);
    triggerSave(newContentString, footnotes, updatedMarginNotes);
  };

  const handleMarginNoteChange = (index: number, val: string) => {
    const updated = { ...marginNotes };
    if (!val.trim()) {
      delete updated[index];
    } else {
      updated[index] = val;
    }
    setMarginNotes(updated);
    triggerSave(content, footnotes, updated);
  };

  const handleFootnoteChange = (index: number, val: string) => {
    const updated = [...footnotes];
    updated[index] = val;
    setFootnotes(updated);
    triggerSave(content, updated, marginNotes);
  };

  const handleAddFootnote = () => {
    const updated = [...footnotes, 'New footnote citation text.'];
    setFootnotes(updated);
    triggerSave(content, updated, marginNotes);
  };

  const handleRemoveFootnote = (index: number) => {
    const updated = footnotes.filter((_, i) => i !== index);
    setFootnotes(updated);
    triggerSave(content, updated, marginNotes);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter(t => t !== tagToRemove);
    setTags(updated);
    triggerSave(content, footnotes, marginNotes, contentType, status, visibility, updated);
  };

  // Format date elegantly
  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Unpublished';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  /**
   * Renders a ContentBlock semantically according to strict, restrained editorial standards.
   */
  const getCitationsMap = () => {
    const map: { [id: string]: number } = {};
    const allBlocks = parseContentToBlocks(getFullContentString());
    let index = 1;
    allBlocks.forEach(b => {
      let txt = '';
      if (b.type === 'paragraph') txt = b.text;
      else if (b.type === 'heading') txt = b.text;
      else if (b.type === 'latin-quote') txt = b.text;
      else if (b.type === 'arabic-quote') txt = b.arabic + ' ' + (b.translation || '');
      else if (b.type === 'callout') txt = b.text;
      else if (b.type === 'list') txt = b.items.map(i => i.text).join(' ');
      else if (b.type === 'table') txt = b.headers.join(' ') + ' ' + b.rows.map(r => r.join(' ')).join(' ');
      
      const citeRegex = /\[cite:([^\]]+)\]/g;
      let match;
      while ((match = citeRegex.exec(txt)) !== null) {
        const id = match[1];
        if (!map[id]) {
          map[id] = index++;
        }
      }
    });
    return map;
  };

  const getFigureNumber = (currentIdx: number) => {
    let figCount = 0;
    const allBlocks = parseContentToBlocks(getFullContentString());
    for (let i = 0; i <= currentIdx && i < allBlocks.length; i++) {
      if (allBlocks[i].type === 'image') {
        figCount++;
      }
    }
    return figCount;
  };

  const renderBlock = (block: ContentBlock, idx: number) => {
    const citeMap = getCitationsMap();

    if (block.type === 'heading') {
      const isAr = isArabicText(block.text);
      const textNode = parseInlineFormatting(block.text, citations, referenceSortOrder, citeMap);
      if (block.level === 1) {
        return (
          <h2 
            key={idx} 
            id={`heading-${idx}`}
            dir={isAr ? 'rtl' : 'ltr'} 
            className={`font-serif text-stone-900 font-light mt-8 mb-4 border-b border-stone-200/50 pb-2 pb-2 ${
              isAr ? 'text-right text-2xl font-arabic leading-loose' : 'text-left text-xl md:text-2xl tracking-tight'
            }`}
          >
            {textNode}
          </h2>
        );
      } else if (block.level === 2) {
        return (
          <h3 
            key={idx} 
            id={`heading-${idx}`}
            dir={isAr ? 'rtl' : 'ltr'} 
            className={`font-serif text-stone-850 font-normal mt-6 mb-3 ${
              isAr ? 'text-right text-xl font-arabic leading-loose' : 'text-left text-lg md:text-xl'
            }`}
          >
            {textNode}
          </h3>
        );
      } else {
        return (
          <h4 
            key={idx} 
            id={`heading-${idx}`}
            dir={isAr ? 'rtl' : 'ltr'} 
            className={`font-serif text-stone-700 font-medium mt-4 mb-2 ${
              isAr ? 'text-right text-base font-arabic leading-loose' : 'text-left text-base'
            }`}
          >
            {textNode}
          </h4>
        );
      }
    }

    if (block.type === 'list') {
      const listItems = block.items.map((item, itemIdx) => {
        const isAr = isArabicText(item.text);
        const isChecklist = item.checked !== undefined;
        const textNode = parseInlineFormatting(item.text, citations, referenceSortOrder, citeMap);
        if (isChecklist) {
          return (
            <li 
              key={itemIdx} 
              dir={isAr ? 'rtl' : 'ltr'} 
              className={`flex items-start gap-2.5 my-1.5 ${isAr ? 'justify-start flex-row-reverse text-right' : 'text-left'}`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                disabled
                className="mt-1 h-3.5 w-3.5 rounded border-stone-300 text-adjung-maroon focus:ring-adjung-maroon accent-adjung-maroon cursor-default"
              />
              <span className={`${item.checked ? 'line-through text-stone-400' : 'text-stone-700'} ${isAr ? 'font-arabic text-[17px] leading-loose' : 'font-serif text-[15px] md:text-base leading-relaxed'}`}>
                {textNode}
              </span>
            </li>
          );
        }
        return (
          <li 
            key={itemIdx} 
            className={`my-1 ${isAr ? 'font-arabic text-right text-[17px] leading-loose' : 'font-serif text-left text-[15px] md:text-base leading-relaxed'} text-stone-700`}
          >
            {textNode}
          </li>
        );
      });

      const isChecklist = block.items.some(i => i.checked !== undefined);
      if (block.ordered) {
        return (
          <ol key={idx} className={`my-4 pl-6 ${isChecklist ? 'list-none pl-0 space-y-1' : 'list-decimal space-y-1.5'}`}>
            {listItems}
          </ol>
        );
      } else {
        return (
          <ul key={idx} className={`my-4 pl-6 ${isChecklist ? 'list-none pl-0 space-y-1' : 'list-disc space-y-1.5'}`}>
            {listItems}
          </ul>
        );
      }
    }

    if (block.type === 'table') {
      return (
        <div key={idx} className="my-6 overflow-x-auto border border-stone-200/60 rounded">
          <table className="w-full text-left font-serif text-sm border-collapse bg-white">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-200">
                {block.headers.map((h, hIdx) => {
                  const align = block.alignments?.[hIdx] || 'left';
                  const alignClass = align === 'center' ? 'text-center' : (align === 'right' ? 'text-right' : 'text-left');
                  return (
                    <th key={hIdx} className={`p-3 font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold border-r border-stone-200 last:border-r-0 ${alignClass}`}>
                      {h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50/30 transition-colors">
                  {row.map((cell, cIdx) => {
                    const align = block.alignments?.[cIdx] || 'left';
                    const alignClass = align === 'center' ? 'text-center' : (align === 'right' ? 'text-right' : 'text-left');
                    return (
                      <td key={cIdx} className={`p-3 text-stone-700 border-r border-stone-200 last:border-r-0 leading-relaxed font-sans text-xs md:text-sm ${alignClass}`}>
                        {parseInlineFormatting(cell, citations, referenceSortOrder, citeMap)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (block.type === 'image') {
      const figNum = getFigureNumber(idx);
      return (
        <figure key={idx} className="my-8 text-center bg-transparent select-none">
          <img 
            src={block.url} 
            alt={block.alt} 
            className="max-w-full h-auto mx-auto border border-stone-200/50 p-1.5 bg-white shadow-sm rounded-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Available';
            }}
          />
          <figcaption className="text-xs text-stone-400 mt-2.5 italic font-serif">
            Figure {figNum}: {block.alt || 'Untitled'}
          </figcaption>
        </figure>
      );
    }

    if (block.type === 'divider') {
      return <hr key={idx} className="my-8 border-t border-stone-200/60" />;
    }

    if (block.type === 'code-block') {
      return (
        <div key={idx} className="my-6 relative group text-left">
          {block.language && (
            <span className="absolute top-2 right-3 font-mono text-[8px] uppercase tracking-wider text-stone-400 select-none bg-stone-100/60 px-1 py-0.5 rounded border border-stone-200/40">
              {block.language}
            </span>
          )}
          <pre className="p-4 bg-stone-50 border border-stone-200/80 rounded font-mono text-xs overflow-x-auto text-stone-850 leading-relaxed">
            <code>{block.code}</code>
          </pre>
        </div>
      );
    }

    if (block.type === 'latin-quote') {
      return (
        <blockquote 
          key={idx} 
          className="my-8 pl-6 border-l border-adjung-maroon/20 text-left bg-transparent"
        >
          <p className="font-serif italic text-[14.5px] md:text-[15.5px] text-stone-600 leading-relaxed my-1">
            {parseInlineFormatting(block.text, citations, referenceSortOrder, citeMap)}
          </p>
          {block.attribution && (
            <cite className="block text-[11px] font-mono text-stone-400 uppercase mt-2 tracking-wide font-normal">
              &mdash; {block.attribution}
            </cite>
          )}
        </blockquote>
      );
    }

    if (block.type === 'arabic-quote') {
      return (
        <blockquote 
          key={idx} 
          className="my-8 pr-6 border-r border-adjung-maroon/20 text-right bg-transparent"
        >
          <div dir="rtl">
            <p className="font-arabic text-[18.5px] md:text-[20px] text-stone-900 leading-loose">
              {parseInlineFormatting(block.arabic, citations, referenceSortOrder, citeMap)}
            </p>
          </div>

          {block.translation && (
            <div dir="ltr" className="mt-4 pt-4 border-t border-stone-200/40 text-left">
              <p className="font-serif italic text-[13.5px] md:text-[14.5px] text-stone-500 leading-relaxed">
                {parseInlineFormatting(block.translation, citations, referenceSortOrder, citeMap)}
              </p>
            </div>
          )}
          
          {block.attribution && (
            <cite dir="ltr" className="block text-[11px] font-mono text-stone-400 uppercase mt-2 tracking-wide font-normal text-left">
              &mdash; {block.attribution}
            </cite>
          )}
        </blockquote>
      );
    }

    if (block.type === 'callout') {
      const styles = {
        note: 'bg-stone-50 border-stone-300 text-stone-855',
        warning: 'bg-red-50/50 border-red-200 text-stone-850',
        tip: 'bg-emerald-50/20 border-emerald-200 text-stone-800',
        important: 'bg-stone-100/60 border-stone-800 text-stone-900',
        definition: 'bg-[#802334]/5 border-[#802334]/20 text-stone-850'
      };
      const titleStyles = {
        note: 'text-stone-700 font-bold font-mono',
        warning: 'text-red-950 font-bold font-mono',
        tip: 'text-emerald-950 font-bold font-mono',
        important: 'text-stone-900 font-bold font-mono',
        definition: 'text-[#802334] font-bold font-mono'
      };
      const typeLabels = {
        note: 'Note',
        warning: 'Warning',
        tip: 'Tip',
        important: 'Important',
        definition: 'Definition'
      };
      
      const themeClass = styles[block.calloutType] || styles.note;
      const titleTheme = titleStyles[block.calloutType] || titleStyles.note;
      const label = typeLabels[block.calloutType] || typeLabels.note;
      
      return (
        <div key={idx} className={`my-6 p-4 border-l-2 rounded-sm text-left ${themeClass}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`text-[10px] uppercase tracking-wider ${titleTheme}`}>
              {block.title ? `${label}: ${block.title}` : label}
            </span>
          </div>
          <p className="font-serif text-sm md:text-[15px] leading-relaxed my-0 whitespace-pre-wrap">
            {parseInlineFormatting(block.text, citations, referenceSortOrder, citeMap)}
          </p>
        </div>
      );
    }

    const isAr = isArabicText(block.text);
    return (
      <p
        key={idx}
        dir={isAr ? 'rtl' : 'ltr'}
        className={`leading-relaxed text-[15px] md:text-base text-[#111111] whitespace-pre-wrap ${
          isAr 
            ? 'font-arabic text-right text-lg leading-loose' 
            : 'font-serif text-left'
        }`}
      >
        {parseInlineFormatting(block.text, citations, referenceSortOrder, citeMap)}
      </p>
    );
  };

  const renderTableOfContents = () => {
    if (contentType === 'Note') return null;
    
    const allBlocks = parseContentToBlocks(getFullContentString());
    const headings = allBlocks.filter(b => b.type === 'heading') as HeadingBlock[];
    
    if (headings.length === 0) return null;
    
    return (
      <div className="mb-8 border border-stone-200/80 p-4 rounded bg-stone-50/20 text-left font-sans text-xs">
        <details className="group" open>
          <summary className="font-mono text-[9px] uppercase tracking-wider text-adjung-maroon font-bold cursor-pointer list-none flex items-center justify-between">
            <span>Table of Contents Outline</span>
            <span className="text-stone-400 group-open:hidden">show</span>
            <span className="text-stone-400 hidden group-open:inline">hide</span>
          </summary>
          
          <ul className="mt-3.5 space-y-2 border-t border-stone-200/50 pt-3">
            {headings.map((h, hIdx) => {
              const levelIndent = h.level === 1 ? '' : (h.level === 2 ? 'pl-4 border-l border-stone-200' : 'pl-8 border-l border-stone-200');
              const levelMarker = h.level === 1 ? '§' : (h.level === 2 ? '•' : '◦');
              
              return (
                <li key={`toc-${hIdx}`} className={`${levelIndent} text-stone-600 hover:text-adjung-maroon font-serif`}>
                  <a href={`#heading-${hIdx}`} className="flex items-baseline gap-1.5 transition-colors">
                    <span className="font-mono text-[9px] text-adjung-maroon/60 select-none">{levelMarker}</span>
                    <span className="text-xs">{h.text}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </details>
      </div>
    );
  };

  /**
   * Renders the complete, beautiful published layout.
   * This is used for BOTH reading/viewing and the Writing Desk's live preview.
   */
  const renderPublishedContent = () => {
    return (
      <article className="max-w-4xl mx-auto px-4 md:px-8 bg-white border border-stone-200/50 rounded-md py-8 md:py-12 shadow-sm text-left relative overflow-hidden">
        {/* Header Block */}
        <header className="mb-10 border-b border-stone-200/70 pb-6">
          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-6 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-adjung-maroon">{contentType}</span>
              <span className="text-stone-300">|</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(entry.publishedDate || entry.createdDate)}
              </span>
              <span className="text-stone-300">|</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-stone-400" />
                {getReadingTime(getFullContentString())}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {status === 'Draft' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-medium lowercase">
                  draft
                </span>
              )}
              {visibility === 'Private' && (
                <span className="inline-flex items-center gap-1 text-red-800 text-[10px]">
                  <Lock className="w-3 h-3" /> private
                </span>
              )}
              {visibility === 'Public' && (
                <span className="inline-flex items-center gap-1 text-stone-400 text-[10px]">
                  <Globe className="w-3 h-3" /> canonical public
                </span>
              )}
            </div>
          </div>

          {/* Featured Image */}
          {contentType !== 'Note' && featuredImage && (
            <div className="mb-6 w-full text-center bg-transparent animate-fade-in">
              <img 
                src={featuredImage} 
                alt={title || 'Featured Image'} 
                className="max-w-full h-auto mx-auto border border-stone-200/50 p-2 bg-white shadow-sm rounded-sm max-h-[300px] object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Title Area */}
          {contentType !== 'Note' && title && (
            <h1 className="text-2xl md:text-3.5xl font-serif text-[#111111] font-medium tracking-tight leading-tight mb-3">
              {title}
            </h1>
          )}

          {/* Author / Signature Stamp Block */}
          <div className="mt-4 flex items-center gap-4 text-xs font-serif text-stone-600">
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">Published by</span>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-medium text-stone-900 border-b border-stone-200 pb-0.5">{authorName}</span>
              <span className="text-stone-300 select-none">/</span>
              <span className="font-signature text-3.5xl text-adjung-maroon inline-block ml-0.5 rotate-[-1deg] select-none" title="Author signature stamp">
                {authorSignature}
              </span>
            </div>
          </div>
        </header>

        {/* Excerpt Abstract Block */}
        {contentType !== 'Note' && excerpt && (
          <div className="mb-8 border-l-2 border-adjung-maroon/20 pl-4 py-1 text-stone-500 font-serif italic text-sm md:text-[15px] leading-relaxed text-left animate-fade-in">
            {excerpt}
          </div>
        )}

        {/* Outline-based TOC */}
        {renderTableOfContents()}

        {/* Content Area Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">
          
          {/* Main content body - spans full width or leaves room for margin notes */}
          <div className="xl:col-span-12 space-y-6 text-[#111111] text-[15px] md:text-base leading-relaxed tracking-normal font-serif">
            
            {/* Note & Essay rendering */}
            {(contentType === 'Note' || contentType === 'Essay') && (
              <div className="space-y-6">
                {parseContentToBlocks(content).map((block, idx) => {
                  return renderBlock(block, idx);
                })}
              </div>
            )}

            {/* Article rendering with paragraph-by-paragraph margin notes */}
            {contentType === 'Article' && (
              <div className="space-y-8">
                {paragraphs.map((para, index) => {
                  const hasMarginNote = !!marginNotes[index]?.trim();

                  if (hasMarginNote) {
                    return (
                      <div key={index} className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start border-b border-stone-100/40 pb-6 last:border-b-0">
                        {/* Left: Paragraph Text */}
                        <div className="xl:col-span-8 w-full">
                          {(() => {
                            const block = parseContentToBlocks(para)[0] || { type: 'paragraph', text: para };
                            return renderBlock(block, index);
                          })()}
                        </div>

                        {/* Right: Margin Note Commentary */}
                        <div className="xl:col-span-4 border-l-2 border-adjung-maroon/15 xl:border-l pl-3 xl:pl-4 py-1.5 flex flex-col justify-start">
                          <span className="block font-mono text-[9px] uppercase tracking-wider text-adjung-maroon/70 mb-1 select-none text-left">
                            Margin Note {index + 1}
                          </span>
                          <span className="font-sans text-xs italic text-stone-600 leading-relaxed block text-left">
                            {parseInlineFormatting(marginNotes[index])}
                          </span>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={index} className="w-full border-b border-stone-100/40 pb-6 last:border-b-0">
                        {(() => {
                          const block = parseContentToBlocks(para)[0] || { type: 'paragraph', text: para };
                          return renderBlock(block, index);
                        })()}
                      </div>
                    );
                  }
                })}
              </div>
            )}

          </div>

        </div>

        
        {/* Signature Closure */}
        {status === 'Published' && (
          <div className="mt-16 pt-12 flex flex-col items-center justify-center relative pb-8 text-center animate-fade-in">
            <div className="w-16 h-[1px] bg-stone-300 absolute top-0 mt-[-1px]"></div>
            
            {authorSignatureStrokes && authorSignatureStrokes.length > 0 ? (
              <div className="w-48 h-20 -mb-4 z-10 opacity-90 rotate-[-2deg] overflow-visible">
                <SignatureRenderer strokes={authorSignatureStrokes} className="w-full h-full overflow-visible" color="#802334" strokeWidth={2.5} />
              </div>
            ) : (
              <div className="font-signature text-5xl text-adjung-maroon mb-2 rotate-[-2deg]">
                {authorSignature}
              </div>
            )}
            <div className="font-sans font-medium text-stone-900 tracking-wide mt-2">{authorName}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mt-1">
              Published<br/>
              {formatDate(entry.publishedDate || new Date().toISOString())}
            </div>
          </div>
        )}

        {/* Essay Footnotes Section */}
        {contentType === 'Essay' && (
          <div className="mt-16 pt-8 border-t border-stone-300/60 font-sans text-stone-700">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-800">
                Scholarly Footnotes & Citations
              </h3>
            </div>

            {footnotes.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No footnotes registered. Use [^1], [^2] inside text blocks to reference.</p>
            ) : (
              <ol className="space-y-3 font-serif text-[12.5px] leading-relaxed list-none pl-0">
                {footnotes.map((footnote, idx) => {
                  const num = idx + 1;
                  return (
                    <li 
                      key={idx} 
                      id={`footnote-dest-${num}`} 
                      className="group flex gap-3 hover:bg-stone-50 p-1.5 rounded transition"
                    >
                      <span className="font-mono text-xs text-adjung-maroon font-medium w-4 flex-shrink-0">
                        [{num}]
                      </span>
                      
                      <div className="flex-grow text-left text-stone-700">
                        {parseInlineFormatting(footnote)}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}

        {/* References & Bibliography */}
        {citations.length > 0 && (
          <div className="mt-16 pt-8 border-t border-stone-300/60 font-sans text-stone-700">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-850">
                References & Bibliography
              </h3>
              <span className="font-mono text-[9px] text-stone-400 uppercase">
                Sorted by {referenceSortOrder === 'alphabetical' ? 'Author' : 'Appearance'}
              </span>
            </div>

            <ul className="space-y-3 font-serif text-[12.5px] leading-relaxed list-none pl-0">
              {(() => {
                const citeMap = getCitationsMap();
                const sorted = [...citations].sort((a, b) => {
                  if (referenceSortOrder === 'alphabetical') {
                    return a.author.localeCompare(b.author);
                  } else {
                    const aIdx = citeMap[a.id] || 9999;
                    const bIdx = citeMap[b.id] || 9999;
                    return aIdx - bIdx;
                  }
                });

                return sorted.map((cit, idx) => {
                  const displayIdx = citeMap[cit.id] || idx + 1;
                  return (
                    <li 
                      key={cit.id} 
                      id={`reference-${cit.id}`}
                      className="text-stone-700 text-left hover:bg-stone-50/50 p-1.5 rounded transition flex items-baseline gap-2"
                    >
                      <span className="font-mono text-xs text-adjung-maroon font-medium select-none">
                        {referenceSortOrder === 'appearance' ? `[${displayIdx}]` : '•'}
                      </span>
                      <div className="flex-grow">
                        <strong className="font-sans font-semibold text-stone-900">{cit.author}</strong> ({cit.year}). 
                        <span> "{cit.title}."</span> <em>{cit.publisher}</em>.
                        {cit.url && (
                          <a href={cit.url} target="_blank" rel="noopener noreferrer" className="text-adjung-maroon hover:underline ml-1.5 font-mono text-[10px] break-all">
                            [Link]
                          </a>
                        )}
                        {cit.doi && (
                          <span className="text-stone-400 ml-1.5 font-mono text-[10px]">
                            doi:{cit.doi}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                });
              })()}
            </ul>
          </div>
        )}

        {/* Tags Block */}
        {tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-stone-200/40 flex flex-wrap gap-2 items-center">
            <Tag className="w-3.5 h-3.5 text-stone-400" />
            {tags.map((t) => (
              <span key={t} className="font-mono text-[10px] text-adjung-maroon bg-stone-50 px-2 py-0.5 rounded border border-stone-200/30">
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>
    );
  };

  /**
   * Renders the interactive editor canvas (Composer).
   * Fully wide, responsive inputs that make typing highly fluid.
   */
  const renderComposer = () => {
    return (
      <div className="space-y-6 bg-white border border-stone-200 rounded-md p-6 shadow-sm text-left font-sans text-xs text-stone-700">
        <div className="border-b border-stone-250/10 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-mono font-medium text-stone-900 tracking-wider uppercase text-xs">
              Entry Composer
            </h3>
            <p className="text-stone-400 text-[10px] mt-1">
              Write your entry below. Changes propagate to the Live Preview instantly.
            </p>
          </div>
        </div>

        {/* Title */}
        {contentType !== 'Note' && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500">
              Entry Title
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Title of your publication..."
              className="w-full border border-stone-200 bg-white p-2.5 rounded focus:outline-none focus:border-adjung-maroon font-serif text-base text-[#111111]"
            />
          </div>
        )}

        {/* Metadata: Excerpt and Featured Image */}
        {contentType !== 'Note' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50/50 p-4 border border-stone-200/60 rounded-sm">
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500">
                Featured Image URL
              </label>
              <input
                type="text"
                value={featuredImage}
                onChange={handleFeaturedImageChange}
                placeholder="https://example.com/image.jpg"
                className="w-full border border-stone-200 bg-white p-2 rounded focus:outline-none focus:border-adjung-maroon font-mono text-xs text-stone-700"
              />
              {featuredImage && (
                <div className="mt-2 border border-stone-200 p-1 bg-white inline-block rounded-sm max-w-full">
                  <img src={featuredImage} alt="Preview" className="h-12 max-w-full object-cover rounded-sm" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 flex justify-between">
                <span>Excerpt / Abstract</span>
                <span className="text-stone-400 font-normal lowercase">{excerpt.length} chars</span>
              </label>
              <textarea
                value={excerpt}
                onChange={handleExcerptChange}
                placeholder="A concise scholarly abstract or summary of this work..."
                rows={2}
                className="w-full border border-stone-200 bg-white p-2 rounded focus:outline-none focus:border-adjung-maroon font-serif text-xs text-stone-700 leading-relaxed resize-y"
              />
            </div>
          </div>
        )}

        {/* Minimalist Formatting Helper Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-200/80 pb-2.5 mb-1.5 select-none bg-stone-50/30 p-2 rounded">
          <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 mr-1.5">Insert:</span>
          <button
            type="button"
            onClick={() => insertLinePrefix('# ')}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Heading 1 (Ctrl+Shift+1)"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('## ')}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Heading 2 (Ctrl+Shift+2)"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('### ')}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Heading 3 (Ctrl+Shift+3)"
          >
            H3
          </button>
          <span className="w-px h-3 bg-stone-200 mx-0.5" />
          <button
            type="button"
            onClick={() => insertLinePrefix('- ')}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Bullet List"
          >
            Bullet List
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('1. ')}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Numbered List"
          >
            Numbered List
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('- [ ] ')}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Checklist"
          >
            Checklist
          </button>
          <span className="w-px h-3 bg-stone-200 mx-0.5" />
          <button
            type="button"
            onClick={() => {
              setActiveTableInsert(!activeTableInsert);
              setActiveCitationInsert(false);
              setActiveCalloutInsert(false);
            }}
            className={`px-2 py-0.5 rounded text-[9.5px] font-mono border transition cursor-pointer ${activeTableInsert ? 'bg-adjung-maroon text-white border-adjung-maroon' : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'}`}
            title="Visual Table Editor"
          >
            + Table
          </button>
          <button
            type="button"
            onClick={() => { insertMarkdownText('![Figure caption](', ')'); showToast('Figure inserted. Type title/caption in brackets.', 'info'); }}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Image/Figure Block"
          >
            + Figure
          </button>
          <button
            type="button"
            onClick={() => {
              const nextNum = footnotes.length + 1;
              const updated = [...footnotes, 'New footnote description text.'];
              setFootnotes(updated);
              insertMarkdownText(`[^${nextNum}]`);
              triggerSave(content, updated, marginNotes);
              showToast(`Footnote marker [^${nextNum}] inserted`, 'success');
            }}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Insert Footnote Anchor [^n]"
          >
            + Footnote
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCitationInsert(!activeCitationInsert);
              setActiveTableInsert(false);
              setActiveCalloutInsert(false);
            }}
            className={`px-2 py-0.5 rounded text-[9.5px] font-mono border transition cursor-pointer ${activeCitationInsert ? 'bg-adjung-maroon text-white border-adjung-maroon' : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'}`}
            title="Citation Manager Panel"
          >
            + Citation
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCalloutInsert(!activeCalloutInsert);
              setActiveTableInsert(false);
              setActiveCitationInsert(false);
            }}
            className={`px-2 py-0.5 rounded text-[9.5px] font-mono border transition cursor-pointer ${activeCalloutInsert ? 'bg-adjung-maroon text-white border-adjung-maroon' : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'}`}
            title="Visual Callout Builder"
          >
            + Callout
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownText('\n---\n')}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Horizontal Divider"
          >
            Divider
          </button>
          <span className="w-px h-3 bg-stone-200 mx-0.5" />
          <button
            type="button"
            onClick={() => insertMarkdownText('`', '`')}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Inline Code Block"
          >
            Code
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownText('\n```javascript\n', '\n```\n')}
            className="px-2 py-0.5 bg-white hover:bg-stone-100 text-stone-700 rounded text-[9.5px] font-mono border border-stone-200 transition cursor-pointer"
            title="Syntax Code Block"
          >
            Code Block
          </button>
        </div>

        {/* Content input */}
        {(contentType === 'Note' || contentType === 'Essay') ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500">
                Entry Body Content
              </label>
              {contentType === 'Essay' && (
                <span className="text-[10px] text-stone-400 font-mono">
                  Insert footnote markers like <code>[^1]</code> in text.
                </span>
              )}
            </div>

            {/* Premium, Minimalist Editorial Quotation Toolbar */}
            <div className="flex flex-col gap-2 bg-stone-50 border border-stone-200/80 p-3 rounded-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 font-bold">
                    Quotation Builder
                  </span>
                  <span className="text-[10px] text-stone-300 font-sans select-none">|</span>
                  <span className="text-[10px] text-stone-400 font-sans italic">Click to construct & insert semantic quote blocks</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveQuoteInsert(activeQuoteInsert === 'latin' ? null : 'latin')}
                    className={`px-2.5 py-1 font-mono text-[9px] uppercase border rounded transition cursor-pointer ${
                      activeQuoteInsert === 'latin'
                        ? 'bg-adjung-maroon text-white border-adjung-maroon font-medium shadow-sm'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-950'
                    }`}
                  >
                    + Latin Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveQuoteInsert(activeQuoteInsert === 'arabic' ? null : 'arabic')}
                    className={`px-2.5 py-1 font-mono text-[9px] uppercase border rounded transition cursor-pointer ${
                      activeQuoteInsert === 'arabic'
                        ? 'bg-adjung-maroon text-white border-adjung-maroon font-medium shadow-sm'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-955'
                    }`}
                  >
                    + Arabic Quote
                  </button>
                </div>
              </div>

              {/* Quote config panels */}
              {activeQuoteInsert === 'latin' && (
                <div className="mt-2.5 p-3 bg-white border border-stone-200 rounded-md space-y-3 animate-fade-in text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-stone-100">
                    <span className="text-[9.5px] font-mono text-adjung-maroon uppercase font-bold">Configure Latin Quotation Block</span>
                  </div>
                  <textarea
                    id="latin-quote-input"
                    rows={3}
                    placeholder="Type English or other Latin script quotation text..."
                    className="w-full p-2.5 text-xs border border-stone-200 rounded focus:outline-none focus:border-adjung-maroon font-serif text-[#111111] bg-stone-50/20 leading-relaxed"
                  />
                  <input
                    id="latin-quote-attribution"
                    type="text"
                    placeholder="Attribution (e.g. Ibn Rushd, 1179) - Optional"
                    className="w-full p-2 text-xs border border-stone-200 rounded focus:outline-none focus:border-adjung-maroon bg-stone-50/20"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveQuoteInsert(null)}
                      className="px-2.5 py-1 font-mono text-[9px] uppercase border border-stone-200 text-stone-500 rounded hover:bg-stone-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('latin-quote-input') as HTMLTextAreaElement;
                        const attrInput = document.getElementById('latin-quote-attribution') as HTMLInputElement;
                        const text = input?.value || '';
                        const attr = attrInput?.value ? ` attribution="${attrInput.value.trim()}"` : '';
                        if (text.trim()) {
                          insertQuoteAtCursor(`<quote type="latin"${attr}><text>${text.trim()}</text></quote>`);
                        }
                        setActiveQuoteInsert(null);
                      }}
                      className="px-3 py-1 font-mono text-[9px] uppercase bg-adjung-maroon text-white rounded hover:bg-adjung-maroon/90 font-medium cursor-pointer shadow-sm"
                    >
                      Insert Block
                    </button>
                  </div>
                </div>
              )}

              {activeQuoteInsert === 'arabic' && (
                <div className="mt-2.5 p-3 bg-white border border-stone-200 rounded-md space-y-3.5 animate-fade-in text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-stone-100">
                    <span className="text-[9.5px] font-mono text-adjung-maroon uppercase font-bold">Configure Arabic Quotation Block</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9.5px] font-mono text-stone-500 uppercase mb-1">Original Arabic (RTL)</label>
                      <textarea
                        id="arabic-quote-input-ar"
                        dir="rtl"
                        rows={2}
                        placeholder="اكتب النص العربي هنا..."
                        className="w-full p-2.5 text-sm border border-stone-200 rounded focus:outline-none focus:border-adjung-maroon font-arabic text-right text-stone-900 bg-stone-50/20 leading-loose"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-mono text-stone-500 uppercase mb-1">English/Malay Translation (Optional)</label>
                      <textarea
                        id="arabic-quote-input-en"
                        rows={2}
                        placeholder="Type English translation here..."
                        className="w-full p-2.5 text-xs border border-stone-200 rounded focus:outline-none focus:border-adjung-maroon font-serif text-[#111111] bg-stone-50/20 leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-mono text-stone-500 uppercase mb-1">Attribution (Optional)</label>
                      <input
                        id="arabic-quote-attribution"
                        type="text"
                        placeholder="Attribution (e.g. Al-Ghazali) - Optional"
                        className="w-full p-2 text-xs border border-stone-200 rounded focus:outline-none focus:border-adjung-maroon bg-stone-50/20"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveQuoteInsert(null)}
                      className="px-2.5 py-1 font-mono text-[9px] uppercase border border-stone-200 text-stone-500 rounded hover:bg-stone-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const arInput = document.getElementById('arabic-quote-input-ar') as HTMLTextAreaElement;
                        const enInput = document.getElementById('arabic-quote-input-en') as HTMLTextAreaElement;
                        const attrInput = document.getElementById('arabic-quote-attribution') as HTMLInputElement;
                        const arabic = arInput?.value || '';
                        const translation = enInput?.value || '';
                        const attr = attrInput?.value ? ` attribution="${attrInput.value.trim()}"` : '';
                        if (arabic.trim()) {
                          const transXml = translation.trim() ? `\n  <translation>${translation.trim()}</translation>` : '';
                          insertQuoteAtCursor(`<quote type="arabic"${attr}>\n  <arabic>${arabic.trim()}</arabic>${transXml}\n</quote>`);
                        }
                        setActiveQuoteInsert(null);
                      }}
                      className="px-3 py-1 font-mono text-[9px] uppercase bg-adjung-maroon text-white rounded hover:bg-adjung-maroon/90 font-medium cursor-pointer shadow-sm"
                    >
                      Insert Block
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Visual Table Editor Panel */}
            {activeTableInsert && (
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-md space-y-4 text-left animate-fade-in">
                <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-adjung-maroon font-bold">Visual Table Editor Grid</span>
                  <button 
                    type="button" 
                    onClick={() => setActiveTableInsert(false)} 
                    className="text-stone-400 hover:text-stone-700 text-xs font-mono"
                  >
                    Close
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      const newRow = Array(tableHeaders.length).fill('');
                      setTableData([...tableData, newRow]);
                    }}
                    className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded font-mono cursor-pointer"
                  >
                    + Add Row
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (tableData.length > 1) {
                        setTableData(tableData.slice(0, -1));
                      }
                    }}
                    className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded font-mono cursor-pointer"
                  >
                    - Remove Row
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTableHeaders([...tableHeaders, `Header ${tableHeaders.length + 1}`]);
                      setTableAlignments([...tableAlignments, 'left']);
                      setTableData(tableData.map(row => [...row, '']));
                    }}
                    className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded font-mono cursor-pointer"
                  >
                    + Add Column
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (tableHeaders.length > 1) {
                        setTableHeaders(tableHeaders.slice(0, -1));
                        setTableAlignments(tableAlignments.slice(0, -1));
                        setTableData(tableData.map(row => row.slice(0, -1)));
                      }
                    }}
                    className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded font-mono cursor-pointer"
                  >
                    - Remove Column
                  </button>
                </div>

                <div className="overflow-x-auto border border-stone-200 rounded bg-white p-2">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        {tableHeaders.map((header, cIdx) => (
                          <th key={`th-${cIdx}`} className="p-1 border border-stone-100 min-w-[120px]">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...tableAlignments];
                                    next[cIdx] = 'left';
                                    setTableAlignments(next);
                                  }}
                                  className={`px-1 text-[8px] font-mono border rounded cursor-pointer ${tableAlignments[cIdx] === 'left' ? 'bg-adjung-maroon text-white border-adjung-maroon' : 'bg-stone-50 border-stone-200'}`}
                                >
                                  L
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...tableAlignments];
                                    next[cIdx] = 'center';
                                    setTableAlignments(next);
                                  }}
                                  className={`px-1 text-[8px] font-mono border rounded cursor-pointer ${tableAlignments[cIdx] === 'center' ? 'bg-adjung-maroon text-white border-adjung-maroon' : 'bg-stone-50 border-stone-200'}`}
                                >
                                  C
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...tableAlignments];
                                    next[cIdx] = 'right';
                                    setTableAlignments(next);
                                  }}
                                  className={`px-1 text-[8px] font-mono border rounded cursor-pointer ${tableAlignments[cIdx] === 'right' ? 'bg-adjung-maroon text-white border-adjung-maroon' : 'bg-stone-50 border-stone-200'}`}
                                >
                                  R
                                </button>
                              </div>
                              <input
                                type="text"
                                value={header}
                                onChange={(e) => {
                                  const next = [...tableHeaders];
                                  next[cIdx] = e.target.value;
                                  setTableHeaders(next);
                                }}
                                className="w-full text-center p-1 text-xs border border-stone-200 bg-stone-50 font-bold focus:outline-none rounded focus:border-adjung-maroon text-stone-900"
                              />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, rIdx) => (
                        <tr key={`tr-${rIdx}`}>
                          {row.map((cell, cIdx) => (
                            <td key={`td-${rIdx}-${cIdx}`} className="p-1 border border-stone-100">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => {
                                  const nextData = tableData.map((r, ri) => 
                                    ri === rIdx ? r.map((c, ci) => ci === cIdx ? e.target.value : c) : r
                                  );
                                  setTableData(nextData);
                                }}
                                className="w-full p-1 text-xs border border-stone-100 bg-white focus:outline-none rounded focus:border-adjung-maroon text-stone-800"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setTableHeaders(['Header 1', 'Header 2', 'Header 3']);
                      setTableAlignments(['left', 'left', 'left']);
                      setTableData([
                        ['Cell 1.1', 'Cell 1.2', 'Cell 1.3'],
                        ['Cell 2.1', 'Cell 2.2', 'Cell 2.3']
                      ]);
                      setActiveTableInsert(false);
                    }}
                    className="px-2.5 py-1 border border-stone-200 text-stone-500 rounded font-mono hover:bg-stone-50 cursor-pointer"
                  >
                    Reset & Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const headerStr = '| ' + tableHeaders.join(' | ') + ' |';
                      const sepStr = '| ' + tableAlignments.map(align => {
                        if (align === 'center') return ':---:';
                        if (align === 'right') return '---:';
                        return '---';
                      }).join(' | ') + ' |';
                      const rowStrings = tableData.map(row => '| ' + row.join(' | ') + ' |');
                      const tableText = `\n${headerStr}\n${sepStr}\n${rowStrings.join('\n')}\n`;
                      
                      insertMarkdownText(tableText);
                      setActiveTableInsert(false);
                      showToast('Visual table block inserted', 'success');
                    }}
                    className="px-3 py-1 font-mono uppercase bg-adjung-maroon text-white font-medium rounded hover:bg-adjung-maroon/90 shadow-sm cursor-pointer"
                  >
                    Insert Table Block
                  </button>
                </div>
              </div>
            )}

            {/* Visual Callout Builder Panel */}
            {activeCalloutInsert && (
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-md space-y-3 text-left animate-fade-in">
                <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-adjung-maroon font-bold">Visual Callout Block Builder</span>
                  <button 
                    type="button" 
                    onClick={() => setActiveCalloutInsert(false)} 
                    className="text-stone-400 hover:text-stone-700 text-xs font-mono"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-mono text-stone-500 uppercase">Callout Style/Type</label>
                    <select
                      id="callout-insert-type"
                      className="w-full p-2 border border-stone-200 text-xs bg-white focus:outline-none rounded focus:border-adjung-maroon text-stone-800"
                    >
                      <option value="note">Note (Sleek Slate)</option>
                      <option value="warning">Warning (Crimson Sand)</option>
                      <option value="tip">Tip (Olive Sage)</option>
                      <option value="important">Important (Charcoal Obsidian)</option>
                      <option value="definition">Definition (Maroon Parchment)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-mono text-stone-500 uppercase">Header Title (Optional)</label>
                    <input
                      id="callout-insert-title"
                      type="text"
                      placeholder="e.g. Scholarly Note"
                      className="w-full p-2 border border-stone-200 text-xs bg-white focus:outline-none rounded focus:border-adjung-maroon text-stone-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9.5px] font-mono text-stone-500 uppercase">Callout Body Text</label>
                  <textarea
                    id="callout-insert-text"
                    rows={2.5}
                    placeholder="Enter callout body content..."
                    className="w-full p-2 border border-stone-200 text-xs bg-white focus:outline-none rounded focus:border-adjung-maroon text-stone-800 font-serif leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setActiveCalloutInsert(false)}
                    className="px-2.5 py-1 border border-stone-200 text-stone-500 rounded font-mono hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const typeEl = document.getElementById('callout-insert-type') as HTMLSelectElement;
                      const titleEl = document.getElementById('callout-insert-title') as HTMLInputElement;
                      const textEl = document.getElementById('callout-insert-text') as HTMLTextAreaElement;
                      
                      const cType = typeEl?.value || 'note';
                      const cTitle = titleEl?.value?.trim() || '';
                      const cText = textEl?.value?.trim() || '';
                      
                      if (!cText) {
                        alert('Callout body text is required.');
                        return;
                      }
                      
                      const titleAttr = cTitle ? ` title="${cTitle}"` : '';
                      const calloutStr = `\n<callout type="${cType}"${titleAttr}>\n  ${cText}\n</callout>\n`;
                      
                      insertMarkdownText(calloutStr);
                      setActiveCalloutInsert(false);
                      showToast('Visual callout block inserted', 'success');
                    }}
                    className="px-3 py-1 font-mono uppercase bg-adjung-maroon text-white font-medium rounded hover:bg-adjung-maroon/90 shadow-sm cursor-pointer"
                  >
                    Insert Callout Block
                  </button>
                </div>
              </div>
            )}

            {/* Visual Citation Manager Panel */}
            {activeCitationInsert && (
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-md space-y-4 text-left animate-fade-in">
                <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-adjung-maroon font-bold">Citation Registry Manager</span>
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] font-mono text-stone-500 uppercase">Sort style:</label>
                    <select
                      value={referenceSortOrder}
                      onChange={(e) => {
                        const style = e.target.value as 'alphabetical' | 'appearance';
                        setReferenceSortOrder(style);
                        triggerSave(content, footnotes, marginNotes, contentType, status, visibility, tags, slug, title, excerpt, featuredImage, revisions, citations, style);
                        showToast(`Bibliography sorting style changed to ${style}`, 'success');
                      }}
                      className="p-1 text-[9.5px] border border-stone-200 bg-white font-mono rounded text-stone-850"
                    >
                      <option value="alphabetical">Alphabetical (Harvard)</option>
                      <option value="appearance">Appearance (Vancouver)</option>
                    </select>
                  </div>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const author = (form.elements.namedItem('cit_author') as HTMLInputElement).value.trim();
                    const title = (form.elements.namedItem('cit_title') as HTMLInputElement).value.trim();
                    const year = parseInt((form.elements.namedItem('cit_year') as HTMLInputElement).value.trim());
                    const publisher = (form.elements.namedItem('cit_publisher') as HTMLInputElement).value.trim();
                    const url = (form.elements.namedItem('cit_url') as HTMLInputElement).value.trim() || undefined;
                    const doi = (form.elements.namedItem('cit_doi') as HTMLInputElement).value.trim() || undefined;
                    
                    if (!author || !title || !year || !publisher) {
                      alert('Author, Title, Year, and Publisher are required fields.');
                      return;
                    }
                    
                    handleAddCitation({ author, title, year, publisher, url, doi });
                    form.reset();
                  }}
                  className="space-y-3 bg-white p-3 border border-stone-200 rounded text-[10px]"
                >
                  <div className="text-[9.5px] font-mono text-stone-500 uppercase font-bold">Register New Citation Source</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-stone-400">Author (e.g. Ibn Rushd)</label>
                      <input name="cit_author" type="text" placeholder="Ibn Rushd" className="w-full p-1.5 border border-stone-200 rounded text-xs text-stone-700 bg-stone-50/10 focus:outline-none focus:border-adjung-maroon" required />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-stone-400">Book/Article Title</label>
                      <input name="cit_title" type="text" placeholder="The Incoherence of the Incoherence" className="w-full p-1.5 border border-stone-200 rounded text-xs text-stone-700 bg-stone-50/10 focus:outline-none focus:border-adjung-maroon" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1 md:col-span-1">
                      <label className="block text-[9px] font-mono uppercase text-stone-400">Year</label>
                      <input name="cit_year" type="number" placeholder="1179" className="w-full p-1.5 border border-stone-200 rounded text-xs text-stone-700 bg-stone-50/10 focus:outline-none focus:border-adjung-maroon" required />
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <label className="block text-[9px] font-mono uppercase text-stone-400">Publisher</label>
                      <input name="cit_publisher" type="text" placeholder="Cordoba Academic Press" className="w-full p-1.5 border border-stone-200 rounded text-xs text-stone-700 bg-stone-50/10 focus:outline-none focus:border-adjung-maroon" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-stone-400">URL (Optional)</label>
                      <input name="cit_url" type="url" placeholder="https://example.org/rushd" className="w-full p-1.5 border border-stone-200 rounded text-xs text-stone-700 bg-stone-50/10 focus:outline-none focus:border-adjung-maroon" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-stone-400">DOI Reference (Optional)</label>
                      <input name="cit_doi" type="text" placeholder="10.1016/j.rushd.1179" className="w-full p-1.5 border border-stone-200 rounded text-xs text-stone-700 bg-stone-50/10 focus:outline-none focus:border-adjung-maroon" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button type="submit" className="px-3.5 py-1 font-mono uppercase bg-adjung-maroon text-white font-medium rounded hover:bg-adjung-maroon/90 shadow-sm cursor-pointer">
                      Register Source
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  <div className="text-[9.5px] font-mono text-stone-500 uppercase font-bold">Registered References ({citations.length})</div>
                  {citations.length === 0 ? (
                    <div className="p-3 border border-dashed border-stone-200 rounded bg-white text-stone-400 text-center font-serif italic text-xs">
                      No citations registered. Use the form above to add references.
                    </div>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto border border-stone-200 rounded bg-white divide-y divide-stone-100">
                      {citations.map((cit) => (
                        <div key={cit.id} className="p-2 flex items-center justify-between gap-4 text-xs font-serif hover:bg-stone-50/30">
                          <div className="flex-1 text-stone-700 leading-normal text-[11px]">
                            <strong className="font-sans text-[10px] text-stone-500 uppercase font-bold tracking-tight block">{cit.author} ({cit.year})</strong>
                            <span>"{cit.title}" &mdash; <em>{cit.publisher}</em></span>
                            {cit.doi && <span className="font-mono text-[9px] text-stone-400 ml-1.5">DOI:{cit.doi}</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                insertMarkdownText(`[cite:${cit.id}]`);
                                showToast(`Citation marker [cite:${cit.id}] inserted inline`, 'success');
                              }}
                              className="px-2 py-0.5 border border-adjung-maroon text-adjung-maroon hover:bg-adjung-maroon hover:text-white rounded font-mono text-[9px] transition cursor-pointer"
                              title="Insert inline marker at current cursor"
                            >
                              Insert Inline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCitation(cit.id)}
                              className="p-1 hover:text-red-600 text-stone-400 transition cursor-pointer"
                              title="Delete citation from entry database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <textarea
              value={content}
              onFocus={() => setActiveTextareaIdx(null)}
              onChange={(e) => {
                const val = e.target.value;
                setContent(val);
                triggerSave(val, footnotes, marginNotes);
              }}
              placeholder="Begin typing your manuscript here..."
              className="w-full min-h-[400px] border border-stone-200 bg-white p-3.5 rounded focus:outline-none focus:border-adjung-maroon font-serif text-sm text-[#111111] leading-relaxed resize-y mt-2"
              id="editorial-content-textarea"
            />
          </div>
        ) : (
          /* Article paragraph blocks */
          <div className="space-y-6">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500">
              Article Paragraph Blocks & Margin Notes
            </label>
            <div className="space-y-5">
              {paragraphs.map((para, index) => {
                const blocksOfPara = parseContentToBlocks(para);
                const currentBlock = blocksOfPara[0] || { type: 'paragraph', text: para };
                const currentType = currentBlock.type;

                return (
                  <div key={index} className="p-4 bg-stone-50 border border-stone-200/60 rounded-md space-y-4 relative">
                    <div className="flex flex-wrap items-center justify-between border-b border-stone-200 pb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold text-adjung-maroon uppercase">
                          Block #{index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-stone-400 uppercase select-none">Type:</span>
                        <button
                          type="button"
                          onClick={() => handleBlockTypeChange(index, 'paragraph')}
                          className={`px-2 py-0.5 font-mono text-[9px] uppercase border rounded transition cursor-pointer ${
                            currentType === 'paragraph'
                              ? 'bg-adjung-maroon/10 text-adjung-maroon border-adjung-maroon/30 font-semibold'
                              : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600'
                          }`}
                        >
                          Paragraph
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBlockTypeChange(index, 'latin-quote')}
                          className={`px-2 py-0.5 font-mono text-[9px] uppercase border rounded transition cursor-pointer ${
                            currentType === 'latin-quote'
                              ? 'bg-adjung-maroon/10 text-adjung-maroon border-adjung-maroon/30 font-semibold'
                              : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600'
                          }`}
                        >
                          Latin Quote
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBlockTypeChange(index, 'arabic-quote')}
                          className={`px-2 py-0.5 font-mono text-[9px] uppercase border rounded transition cursor-pointer ${
                            currentType === 'arabic-quote'
                              ? 'bg-adjung-maroon/10 text-adjung-maroon border-adjung-maroon/30 font-semibold'
                              : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600'
                          }`}
                        >
                          Arabic Quote
                        </button>
                      </div>

                      {/* Editorial Toolbar Controls */}
                      <div className="flex items-center gap-1 bg-white border border-stone-200 rounded px-1.5 py-0.5 ml-auto">
                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded transition ${
                            index === 0 ? 'text-stone-250 cursor-not-allowed opacity-40' : 'text-stone-500 hover:text-adjung-maroon hover:bg-stone-50'
                          }`}
                          title="Move block up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === paragraphs.length - 1}
                          className={`p-1 rounded transition ${
                            index === paragraphs.length - 1 ? 'text-stone-250 cursor-not-allowed opacity-40' : 'text-stone-500 hover:text-adjung-maroon hover:bg-stone-50'
                          }`}
                          title="Move block down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-px h-3 bg-stone-200 mx-0.5" />

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => handleDuplicateParagraph(index)}
                          className="p-1 rounded text-stone-500 hover:text-adjung-maroon hover:bg-stone-50 transition"
                          title="Duplicate block"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Insert Below */}
                        <button
                          type="button"
                          onClick={() => handleInsertBelow(index)}
                          className="p-1 rounded text-stone-500 hover:text-adjung-maroon hover:bg-stone-50 transition"
                          title="Insert block below"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        {paragraphs.length > 1 && (
                          <>
                            <span className="w-px h-3 bg-stone-200 mx-0.5" />
                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleRemoveParagraph(index)}
                              className="p-1 rounded text-stone-400 hover:text-red-700 hover:bg-red-50 transition"
                              title="Delete block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Rendering inputs depending on block type */}
                    {currentType === 'paragraph' && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-stone-400 uppercase">Paragraph Content</span>
                        <textarea
                          id={`editorial-content-textarea-${index}`}
                          onFocus={() => setActiveTextareaIdx(index)}
                          value={currentBlock.text}
                          onChange={(e) => handleContentChange(index, e.target.value)}
                          placeholder={`Write paragraph ${index + 1}...`}
                          className="w-full min-h-[90px] border border-stone-200 bg-white p-2.5 rounded focus:outline-none focus:border-adjung-maroon font-serif text-sm text-[#111111] leading-relaxed resize-y"
                        />
                      </div>
                    )}

                    {currentType === 'latin-quote' && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-stone-400 uppercase">Latin Quotation Text</span>
                        <textarea
                          id={`editorial-content-textarea-${index}`}
                          onFocus={() => setActiveTextareaIdx(index)}
                          value={currentBlock.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            const serialized = `<quote type="latin"><text>${val}</text></quote>`;
                            handleContentChange(index, serialized);
                          }}
                          placeholder="Type quotation text..."
                          className="w-full min-h-[90px] border border-stone-200 bg-white p-2.5 rounded focus:outline-none focus:border-adjung-maroon font-serif text-sm italic text-stone-700 leading-relaxed resize-y"
                        />
                      </div>
                    )}

                    {currentType === 'arabic-quote' && (
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-stone-400 uppercase">Original Arabic (RTL)</span>
                          <textarea
                            id={`editorial-content-textarea-${index}`}
                            onFocus={() => setActiveTextareaIdx(index)}
                            dir="rtl"
                            value={currentBlock.arabic}
                            onChange={(e) => {
                              const val = e.target.value;
                              const transPart = currentBlock.translation ? `\n  <translation>${currentBlock.translation}</translation>` : '';
                              const serialized = `<quote type="arabic">\n  <arabic>${val}</arabic>${transPart}\n</quote>`;
                              handleContentChange(index, serialized);
                            }}
                            placeholder="اكتب النص العربي هنا..."
                            className="w-full min-h-[80px] border border-stone-200 bg-white p-2.5 rounded focus:outline-none focus:border-adjung-maroon font-arabic text-sm text-right text-stone-900 leading-loose resize-y"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-stone-400 uppercase">English/Malay Translation (Optional)</span>
                          <textarea
                            value={currentBlock.translation || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const transPart = val ? `\n  <translation>${val}</translation>` : '';
                              const serialized = `<quote type="arabic">\n  <arabic>${currentBlock.arabic}</arabic>${transPart}\n</quote>`;
                              handleContentChange(index, serialized);
                            }}
                            placeholder="Type translation text..."
                            className="w-full min-h-[60px] border border-stone-200 bg-white p-2.5 rounded focus:outline-none focus:border-adjung-maroon font-serif text-xs text-stone-600 leading-relaxed resize-y"
                          />
                        </div>
                      </div>
                    )}

                    {/* Margin Note Text */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-stone-400 uppercase">Margin Note Commentary</span>
                      <textarea
                        value={marginNotes[index] || ''}
                        onChange={(e) => handleMarginNoteChange(index, e.target.value)}
                        placeholder="Add scholarly margin annotation directly opposite this paragraph..."
                        className="w-full min-h-[60px] border border-stone-200 bg-white p-2.5 rounded font-sans text-xs text-stone-600 focus:outline-none focus:border-adjung-maroon resize-y"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddParagraph}
              className="w-full border border-dashed border-stone-300 py-3 rounded-md text-stone-500 hover:text-adjung-maroon hover:border-adjung-maroon/60 transition font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 bg-white"
            >
              <Plus className="w-4 h-4" />
              Insert Editorial Paragraph Block
            </button>
          </div>
        )}

        {/* Essay Footnotes Editor List */}
        {contentType === 'Essay' && (
          <div className="space-y-4 border-t border-stone-200/60 pt-4">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500">
                Footnotes & Citations Registry
              </label>
              <button
                type="button"
                onClick={handleAddFootnote}
                className="flex items-center gap-1 text-[10px] text-adjung-maroon border border-adjung-maroon/20 hover:bg-adjung-maroon/5 px-2 py-1 rounded transition font-mono uppercase tracking-wider"
              >
                <Plus className="w-3 h-3" /> Add Citation
              </button>
            </div>

            {footnotes.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No footnotes registered. Put <code>[^1]</code> in paragraphs to reference.</p>
            ) : (
              <div className="space-y-3">
                {footnotes.map((footnote, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-stone-50 p-2.5 border border-stone-200 rounded-md">
                    <span className="font-mono text-xs text-adjung-maroon font-medium w-5 mt-1.5">
                      [{idx + 1}]
                    </span>
                    <textarea
                      value={footnote}
                      onChange={(e) => handleFootnoteChange(idx, e.target.value)}
                      className="w-full bg-white border border-stone-200 p-2 rounded text-xs focus:outline-none focus:border-adjung-maroon resize-y"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFootnote(idx)}
                      className="text-stone-300 hover:text-red-700 p-1 rounded mt-1"
                      title="Remove Footnote"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Real-time Statistics & Autosave Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 px-1 text-[10px] font-mono text-stone-500 border-t border-stone-150 pt-3 select-none">
          <div className="flex items-center gap-3">
            <span>{getCharCount(getFullContentString())} characters</span>
            <span className="text-stone-300">|</span>
            <span>{getWordCount(getFullContentString())} words</span>
            <span className="text-stone-300">|</span>
            <span>{getReadingTime(getFullContentString())}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {saveStatus === 'saving' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Saving draft...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-650">Error saving changes</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full relative ${mode === 'edit' ? 'pb-28' : ''}`}>
      {mode === 'view' ? (
        // Standard high-contrast reading layout
        renderPublishedContent()
      ) : (
        // Beautiful side-by-side composer layout with instant live folio preview
        <div className="space-y-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Hand: Interactive Entry Composer */}
            <div className="lg:col-span-6 space-y-6">
              {renderComposer()}
            </div>
            
            {/* Right Hand: Full Live Folio Preview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-stone-50/50 border border-adjung-maroon/10 rounded-lg p-3 md:p-5 relative shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-adjung-maroon/10 pb-2">
                  <div className="flex items-center gap-1.5 select-none">
                    <BookOpen className="w-4 h-4 text-adjung-maroon" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-adjung-maroon font-semibold">
                      Live Preview
                    </span>
                  </div>
                  <span className="text-[9.5px] font-mono text-stone-400">Updates in real-time</span>
                </div>
                
                {/* Embedded render of the final publication */}
                {renderPublishedContent()}
              </div>
            </div>

          </div>

          {/* Collapsible Publishing Controls at the bottom */}
          <div className="max-w-4xl mx-auto mt-12 pt-6 border-t border-stone-200/60">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 mx-auto text-xs font-mono uppercase tracking-wider text-stone-600 hover:text-adjung-maroon bg-stone-100 hover:bg-stone-200/70 rounded transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              {showSettings ? 'Hide Settings' : 'Publishing Settings'}
            </button>
            
            {showSettings && (
              <div className="mt-6 p-6 bg-white border border-adjung-maroon/20 rounded shadow-sm space-y-6 animate-fade-in font-sans text-xs text-stone-700 scholarly-border text-left">
                <div className="flex items-center justify-between border-b border-adjung-maroon/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-adjung-maroon animate-pulse" />
                    <h4 className="font-mono font-medium text-stone-900 tracking-wider uppercase text-xs">Publishing Settings</h4>
                  </div>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this entry permanently?')) {
                          onDelete(entry.id);
                        }
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Entry
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Format Picker */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1">Format</label>
                    <select
                      value={contentType}
                      onChange={(e) => {
                        const type = e.target.value as EntryType;
                        setContentType(type);
                        triggerSave(content, footnotes, marginNotes, type);
                      }}
                      className="w-full border border-stone-200 bg-white p-1.5 rounded focus:outline-none focus:border-adjung-maroon font-serif text-sm"
                    >
                      <option value="Note">Note</option>
                      <option value="Essay">Essay (supports footnotes)</option>
                      <option value="Article">Article (supports margin notes)</option>
                    </select>
                    <p className="text-[10px] text-stone-400 mt-1">
                      {contentType === 'Note' && 'Short form text. Supports Arabic/Jawi.'}
                      {contentType === 'Essay' && 'Classical long form. Supports bottom footnotes.'}
                      {contentType === 'Article' && 'Highly structured. Supports side margin notes.'}
                    </p>
                  </div>

                  {/* Publishing Status */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => {
                        const s = e.target.value as EntryStatus;
                        setStatus(s);
                        triggerSave(content, footnotes, marginNotes, contentType, s);
                      }}
                      className="w-full border border-stone-200 bg-white p-1.5 rounded focus:outline-none focus:border-adjung-maroon font-mono text-xs"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1">Visibility</label>
                    <select
                      value={visibility}
                      onChange={(e) => {
                        const v = e.target.value as EntryVisibility;
                        setVisibility(v);
                        triggerSave(content, footnotes, marginNotes, contentType, status, v);
                      }}
                      className="w-full border border-stone-200 bg-white p-1.5 rounded focus:outline-none focus:border-adjung-maroon font-mono text-xs"
                    >
                      <option value="Public">Public (visible in Folio)</option>
                      <option value="Private">Private (unpublished/secret)</option>
                    </select>
                  </div>

                  {/* URL Slug */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1">Slug</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                        setSlug(val);
                        triggerSave(content, footnotes, marginNotes, contentType, status, visibility, tags, val);
                      }}
                      placeholder="url-slug-here"
                      className="w-full border border-stone-200 bg-white p-1.5 rounded focus:outline-none focus:border-adjung-maroon font-mono text-xs text-stone-600"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="border-t border-stone-200/60 pt-3">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1">Tags</span>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-800 px-2 py-0.5 rounded font-mono text-[10px] transition">
                        {t}
                        <button type="button" onClick={() => handleRemoveTag(t)} className="text-stone-400 hover:text-red-700 font-bold ml-0.5 font-sans">×</button>
                      </span>
                    ))}
                    {tags.length === 0 && <span className="text-stone-400 italic text-[11px]">No tags associated yet.</span>}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="border border-stone-200 bg-white px-2 py-1 rounded focus:outline-none focus:border-adjung-maroon text-xs flex-grow font-sans"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = newTag.trim();
                          if (val && !tags.includes(val)) {
                            const updated = [...tags, val];
                            setTags(updated);
                            setNewTag('');
                            triggerSave(content, footnotes, marginNotes, contentType, status, visibility, updated);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newTag.trim();
                        if (val && !tags.includes(val)) {
                          const updated = [...tags, val];
                          setTags(updated);
                          setNewTag('');
                          triggerSave(content, footnotes, marginNotes, contentType, status, visibility, updated);
                        }
                      }}
                      className="bg-adjung-maroon text-[#FDFDFD] px-3 py-1 rounded text-xs hover:opacity-90 font-mono tracking-wider cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Revision History Logs */}
                <div className="border-t border-stone-200/60 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500">
                      Revision Log & Version Control
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCreateManualRevision()}
                      className="text-[10px] text-adjung-maroon border border-adjung-maroon/20 hover:bg-adjung-maroon/5 px-2 py-1 rounded transition font-mono uppercase tracking-wider cursor-pointer"
                    >
                      Take Snapshot
                    </button>
                  </div>

                  {revisions.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">No revisions cataloged. Revisions are created on manual update/publish or taking a snapshot.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto border border-stone-200/60 rounded-md p-2 bg-stone-50/40">
                      {revisions.slice().reverse().map((rev, index) => {
                        const revTime = new Date(rev.timestamp).toLocaleString();
                        const words = getWordCount(rev.content);
                        const chars = getCharCount(rev.content);
                        return (
                          <div key={rev.id} className="flex flex-wrap items-center justify-between p-2 bg-white border border-stone-205/60 rounded text-[10.5px] gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-stone-450 font-medium">
                                #{revisions.length - index}
                              </span>
                              <span className="font-sans text-stone-600 font-medium">
                                {revTime}
                              </span>
                              <span className="text-[8.5px] font-mono uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                                {rev.status}
                              </span>
                              <span className="text-stone-400 font-mono text-[9.5px]">
                                ({words} words, {chars} chars)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleRestoreRevision(rev)}
                                className="text-[10px] font-mono text-[#802334] hover:underline cursor-pointer uppercase font-semibold"
                              >
                                Restore
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* XML Canonical Schema Export */}
                <div className="border-t border-stone-200/60 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500">
                      Semantic XML Export (SPEC-016 / SPEC-017)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const xmlStr = getXmlString();
                        navigator.clipboard.writeText(xmlStr);
                        showToast('XML copied to clipboard', 'success');
                      }}
                      className="text-[10px] text-adjung-maroon border border-adjung-maroon/20 hover:bg-adjung-maroon/5 px-2 py-1 rounded transition font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy XML
                    </button>
                  </div>
                  <div className="relative">
                    <pre className="p-3 bg-stone-50 border border-stone-200/60 rounded text-[10px] font-mono text-stone-600 overflow-x-auto leading-relaxed max-h-48 whitespace-pre select-all select-text">
                      {getXmlString()}
                    </pre>
                  </div>
                </div>

                {/* Tips block */}
                <div className="border-t border-stone-100 pt-3 flex gap-2 text-[10.5px] text-[#802334] leading-normal bg-stone-50/40 p-2.5 rounded">
                  <Info className="w-3.5 h-3.5 text-adjung-maroon flex-shrink-0 mt-0.5" />
                  <div>
                    {contentType === 'Note' && (
                      <span><strong>Note writing mode:</strong> Write your text freely. Notes are succinct, rapid reflections. Arabic/Jawi scripts are auto-formatted with dominant-language right-to-left layout alignment.</span>
                    )}
                    {contentType === 'Essay' && (
                      <span><strong>Essay writing mode:</strong> Ideal for long-form literature. Insert footnote markers using <code>[^1]</code>, <code>[^2]</code>, etc. inside paragraphs. Register bottom citations below.</span>
                    )}
                    {contentType === 'Article' && (
                      <span><strong>Article writing mode:</strong> Multi-paragraph publication. Write paragraph blocks with corresponding margin commentary notes that align horizontally on desktop screens.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom/Fixed Footer Actions Bar */}
      {mode === 'edit' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1e1c18] text-stone-100 border-t border-stone-800 shadow-2xl py-3.5 px-4 md:px-8 backdrop-blur-md bg-opacity-95">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left section: Info/Metadata */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-left">
                <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Editing Entry</span>
                <span className="font-serif text-sm font-medium text-stone-200">
                  {contentType === 'Note' ? 'Philosophical Fragment (Note)' : (title || 'Untitled Entry')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-stone-800/85 px-2 py-1 rounded border border-stone-700/60">
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'Published' ? 'bg-emerald-400' : status === 'Archived' ? 'bg-stone-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="font-mono text-[9px] uppercase tracking-wider text-stone-300">
                  {status} ({visibility.toLowerCase()})
                </span>
              </div>
            </div>

            {/* Right section: Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Save Draft Button */}
              <button
                type="button"
                onClick={() => {
                  setStatus('Draft');
                  forceImmediateSave('Draft', visibility);
                  showToast('Draft saved', 'success');
                }}
                className={`px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-all font-medium border border-transparent cursor-pointer ${
                  status === 'Draft'
                    ? 'bg-stone-800 text-stone-450 border-stone-700/65 cursor-default opacity-85'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                }`}
              >
                Save Draft
              </button>

              {/* Publish Button */}
              <button
                type="button"
                onClick={() => {
                  setStatus('Published');
                  setVisibility('Public');
                  forceImmediateSave('Published', 'Public');
                  showToast('Entry published', 'success');
                }}
                className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-[#802334] text-[#FDFDFD] hover:bg-[#962e41] rounded transition-all font-medium cursor-pointer shadow-sm hover:shadow-md"
              >
                Publish
              </button>

              {/* Update Button */}
              <button
                type="button"
                onClick={() => {
                  forceImmediateSave(status, visibility);
                  showToast('Changes saved', 'success');
                }}
                className="px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-stone-700 hover:bg-stone-600 text-stone-100 rounded transition-all font-medium cursor-pointer"
              >
                Update
              </button>

              {/* Archive Button */}
              <button
                type="button"
                onClick={() => {
                  setStatus('Archived');
                  forceImmediateSave('Archived', visibility);
                  showToast('Changes saved', 'success');
                }}
                className={`px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-all font-medium border border-transparent cursor-pointer ${
                  status === 'Archived'
                    ? 'bg-stone-800 text-stone-450 border-stone-700/65 cursor-default opacity-85'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                }`}
              >
                Archive
              </button>

              {/* Delete Button */}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this canonical entry permanently?')) {
                      onDelete(entry.id);
                    }
                  }}
                  className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/40 hover:border-red-700/60 rounded transition-all font-medium cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Elegant Editorial Toast Notification */}
      {toast && (
        <div 
          onClick={() => setToastVisible(false)}
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform cursor-pointer select-none max-w-sm w-auto ${
            toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="bg-[#FDFDFD] border border-stone-200/80 shadow-sm px-4 py-2.5 rounded-sm flex items-center gap-2.5 font-serif text-[13px] text-stone-700 hover:border-stone-300 transition-colors">
            <span className="text-[#802334] font-semibold">✓</span>
            <span className="tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
