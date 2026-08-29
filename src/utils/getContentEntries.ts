// Content is the social-feed-style surface, grouped with Frontpage as one
// pair (Frontpage = curated home, Content = the raw chronological stream)
// while Directory+Index is the other pair (search/catalogue, never a feed).
// Unlike Index, Content mixes Note and Essay together and is explicitly
// allowed to feel like a feed — but "feed" here means load-more, not
// infinite auto-scroll: every batch is a deliberate user action.

import { Entry, User } from '../types';
import { getInitials } from '../utils';

export interface GetContentEntriesParams {
  entries: Entry[];
  page?: number;
  pageSize?: number;
}

export interface GetContentEntriesResult {
  results: Entry[];
  total: number;
  hasMore: boolean;
}

export function getContentEntries({
  entries,
  page = 1,
  pageSize = 15,
}: GetContentEntriesParams): GetContentEntriesResult {
  const eligible = entries.filter(e =>
    e.status === 'Published' &&
    (e.contentType === 'Note' || e.contentType === 'Essay')
  );

  const sorted = [...eligible].sort((a, b) => {
    const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
    const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
    return dateB - dateA;
  });

  const total = sorted.length;
  const end = page * pageSize;
  const results = sorted.slice(0, end);

  return { results, total, hasMore: end < total };
}

export function resolveContentAuthorName(entry: Entry, users: User[]): string {
  if (entry.publicationClass === 'Institutional') {
    return entry.publisher || 'Adjung Editorial Board';
  }
  const author = users.find(u => u.id === entry.authorId);
  return author?.penName || 'Anonymous';
}

/** Adjung's identity mark is a signature, never a photo avatar — the
 *  author's own signature if one exists, otherwise dotted initials. */
export function resolveContentAuthorSig(entry: Entry, users: User[]): string {
  const name = resolveContentAuthorName(entry, users);
  if (entry.publicationClass === 'Institutional') return getInitials(name);
  const author = users.find(u => u.id === entry.authorId);
  return author?.signature || getInitials(name);
}
