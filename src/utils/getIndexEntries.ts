// SPEC-028 §14.1 — Index's data access lives behind this one interface so
// EditorialIndex.tsx never knows it's filtering a plain in-memory array.
// Swapping this to a real Supabase query later requires no UI rewrite: the
// shape of the input/output stays the same, only the body changes.

import { Entry, User } from '../types';
import { isArabicText, stripMarkdown } from '../utils';

export type IndexSortOrder = 'newest' | 'oldest' | 'title-az' | 'title-za';

export interface GetIndexEntriesParams {
  entries: Entry[];
  users: User[];
  query?: string;
  type?: 'All' | 'Essay' | 'Note';
  language?: string;
  tag?: string;
  sort?: IndexSortOrder;
  page?: number;
  pageSize?: number;
}

export interface GetIndexEntriesResult {
  results: Entry[];
  total: number;
  totalPages: number;
  page: number;
}

function resolveLanguage(e: Entry): string {
  return e.language || (isArabicText(e.title || e.content) ? 'Arabic' : 'English');
}

function resolveAuthorName(e: Entry, users: User[]): string {
  if (e.publicationClass === 'Institutional') {
    return e.publisher || 'Adjung Editorial Board';
  }
  const author = users.find(u => u.id === e.authorId);
  return author?.penName || 'Anonymous';
}

export function getIndexEntries({
  entries,
  users,
  query = '',
  type = 'All',
  language = 'All',
  tag = 'All',
  sort = 'newest',
  page = 1,
  pageSize = 20,
}: GetIndexEntriesParams): GetIndexEntriesResult {
  const q = query.trim().toLowerCase();

  const filtered = entries.filter(e => {
    if (e.status !== 'Published') return false;
    if (e.contentType === 'Notice' || e.contentType === "Editor's Note") return false;
    if (type !== 'All' && e.contentType !== type) return false;
    if (language !== 'All' && resolveLanguage(e) !== language) return false;
    if (tag !== 'All' && !(e.tags && e.tags.includes(tag))) return false;

    if (!q) return true;

    const authorName = resolveAuthorName(e, users);
    // Body content is searched too — a reader expects "search" to cover
    // what an entry actually says, not just its title/tags/slug.
    const bodyText = stripMarkdown(e.content || '').toLowerCase();

    return (
      e.title.toLowerCase().includes(q) ||
      authorName.toLowerCase().includes(q) ||
      e.contentType.toLowerCase().includes(q) ||
      (e.tags && e.tags.some(t => t.toLowerCase().includes(q))) ||
      (e.slug && e.slug.toLowerCase().includes(q)) ||
      e.id.toLowerCase().includes(q) ||
      bodyText.includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'newest' || sort === 'oldest') {
      const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
      const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    }
    if (sort === 'title-az') return a.title.localeCompare(b.title);
    if (sort === 'title-za') return b.title.localeCompare(a.title);
    return 0;
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const results = sorted.slice(start, start + pageSize);

  return { results, total, totalPages, page: safePage };
}

export function getIndexFacets(entries: Entry[]) {
  const tagsSet = new Set<string>();
  const langsSet = new Set<string>();

  entries.forEach(e => {
    if (e.status !== 'Published') return;
    if (e.contentType === 'Notice' || e.contentType === "Editor's Note") return;
    if (e.tags) e.tags.forEach(t => t && t.trim() && tagsSet.add(t.trim()));
    langsSet.add(resolveLanguage(e));
  });

  return {
    tags: Array.from(tagsSet).sort(),
    languages: Array.from(langsSet).sort(),
  };
}
