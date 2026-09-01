// Content is the social-feed-style surface, grouped with Frontpage as one
// pair (Frontpage = curated home, Content = the raw chronological stream)
// while Directory+Index is the other pair (search/catalogue, never a feed).
// Unlike Index, Content mixes Note and Essay together and is explicitly
// allowed to feel like a feed — but "feed" here means load-more, not
// infinite auto-scroll: every batch is a deliberate user action.
//
// Content's writer/topic filters (added after Izzat reviewed real Threads/X
// screenshots) are explicit-query narrowing, not inferred personalization —
// the reader picks a name or a tag, nothing is picked for them. That keeps
// it inside the same governing rule Index and Frontpage already follow.

import { Entry, User, IdentityProfile } from '../types';
import { getInitials } from '../utils';
import { resolveSignatureText } from './signatureResolvers';

export interface GetContentEntriesParams {
  entries: Entry[];
  page?: number;
  pageSize?: number;
  /** Multi-select: an entry matches if its author is in this set. Empty = no author filter. */
  authorIds?: string[];
  /** Multi-select: an entry matches if any of its tags is in this set. Empty = no tag filter. */
  tags?: string[];
}

export interface GetContentEntriesResult {
  results: Entry[];
  total: number;
  hasMore: boolean;
}

function isEligible(e: Entry): boolean {
  return e.status === 'Published' && (e.contentType === 'Note' || e.contentType === 'Essay');
}

export function getContentEntries({
  entries,
  page = 1,
  pageSize = 15,
  authorIds = [],
  tags = [],
}: GetContentEntriesParams): GetContentEntriesResult {
  const authorSet = new Set(authorIds);
  const tagSet = new Set(tags);
  const hasFilter = authorSet.size > 0 || tagSet.size > 0;

  const eligible = entries.filter(e => {
    if (!isEligible(e)) return false;
    if (!hasFilter) return true;
    // Simple OR across everything selected — this is a casual glance-and-
    // narrow feed, not Index's deliberate faceted search, so "show me
    // anything from these people or about these topics" reads more
    // naturally than a stricter AND-between-categories rule would.
    const matchesAuthor = authorSet.size > 0 && authorSet.has(e.authorId || '');
    const matchesTag = tagSet.size > 0 && (e.tags || []).some(t => tagSet.has(t));
    return matchesAuthor || matchesTag;
  });

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

export interface ContentWriterFacet {
  authorId: string;
  name: string;
  count: number;
}

export interface ContentTopicFacet {
  tag: string;
  count: number;
}

/** Writers and topics available to filter by, each with how many eligible
 *  entries they cover — lets the sidebar show "Claude (12)" rather than a
 *  bare name, and lets a "Show more" cut stay meaningful (most-published
 *  first). */
export function getContentFacets(entries: Entry[], users: User[]): { writers: ContentWriterFacet[]; topics: ContentTopicFacet[] } {
  const writerCounts = new Map<string, number>();
  const topicCounts = new Map<string, number>();

  entries.forEach(e => {
    if (!isEligible(e)) return;
    if (e.authorId) writerCounts.set(e.authorId, (writerCounts.get(e.authorId) || 0) + 1);
    (e.tags || []).forEach(t => {
      if (!t.trim()) return;
      topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
    });
  });

  const writers: ContentWriterFacet[] = Array.from(writerCounts.entries())
    .map(([authorId, count]) => ({
      authorId,
      name: users.find(u => u.id === authorId)?.penName || 'Anonymous',
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const topics: ContentTopicFacet[] = Array.from(topicCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return { writers, topics };
}

export function resolveContentAuthorName(entry: Entry, users: User[]): string {
  if (entry.publicationClass === 'Institutional') {
    return entry.publisher || 'Adjung Editorial Board';
  }
  const author = users.find(u => u.id === entry.authorId);
  return author?.penName || 'Anonymous';
}

/** Adjung's identity mark is a signature, never a photo avatar — the
 *  author's own signature if one exists, otherwise dotted initials.
 *  Goes through resolveSignatureText (the real DigitalSignature record)
 *  rather than the plain User.signature string — that field only ever
 *  holds usable text for a typed signature; for a drawn one it's just
 *  whatever label SignatureManager stamped on it (e.g. "Signature
 *  8/31/2026"), which isn't fit to display here as if it were the
 *  author's name. */
export function resolveContentAuthorSig(entry: Entry, users: User[], identities: IdentityProfile[]): string {
  const name = resolveContentAuthorName(entry, users);
  if (entry.publicationClass === 'Institutional') return getInitials(name);
  return resolveSignatureText(entry.authorId, '', identities) || getInitials(name);
}
