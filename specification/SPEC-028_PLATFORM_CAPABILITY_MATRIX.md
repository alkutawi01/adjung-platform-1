# PLATFORM CAPABILITY MATRIX

Document ID: SPEC-028
Version: 1.0 (Draft)
Status: Living Document — updated as capabilities change
Depends On:
- SPEC-000 Adjung Constitution
- SPEC-001 Product Philosophy
- SPEC-002 Architecture
- SPEC-025 Architecture Studio
- SPEC-027 Section Layout Engine
- SPEC-099 Development Roadmap

---

## 1. Purpose

This document is the single source of truth for **what actually exists** versus **what is specified but unbuilt**. Every other specification in this folder describes intended behaviour; this document describes real status, verified against the codebase, not assumed from the spec text.

Specs describe the destination. This matrix describes the current position.

## 2. How to Read This Matrix

| Status | Meaning |
|---|---|
| ✅ Built | Working code exists, wired to Supabase, verified in this session or by direct code inspection |
| 🚧 Partial | Some code exists but incomplete, disconnected, or still on the old mockDb/Firebase path |
| 📜 Spec Only | Fully or partially specified in another document, zero implementation |
| ❌ Not Started | No spec, no code |

**Required column** marks whether the capability is needed for **MVP** (small trusted circle), **Beta** (invite-only wider group), or **v2** (post-launch).

Identity note: Adjung has no avatar/profile picture. Visual identity is carried entirely by the Signature system (typed or drawn). Do not reintroduce avatars.

---

## 3. Layer 0 — Foundation (Specification)

All of these are written. This layer is in good shape and is not the bottleneck.

| Capability | Status | Required |
|---|---|---|
| Constitution | ✅ Built (as doc) | MVP |
| Product Philosophy | ✅ Built (as doc) | MVP |
| Domain Architecture | ✅ Built (as doc) | MVP |
| Navigation / Routing spec | ✅ Built (as doc) | MVP |
| Identity System spec | ✅ Built (as doc) | MVP |
| Access Policy / RBAC spec | ✅ Built (as doc) | MVP |
| Database Model spec | ✅ Built (as doc) | MVP |
| UI System spec | ✅ Built (as doc, high-level only — no token/component spec yet) | Beta |

---

## 4. Layer 1 — Core Engine (Implementation)

### Identity Engine
| Capability | Status | Required |
|---|---|---|
| Login (Supabase Auth) | ✅ Built, verified live | MVP |
| Register (real account, not just DB row) | 🚧 Partial — SignUpWizard/invite flow writes to `users` table but never calls `supabase.auth.signUp()`; new users cannot log in yet | MVP |
| Session persistence | ✅ Built | MVP |
| Email verification | ❌ Not started | Beta |
| Biography | ✅ Built — `identities.biography` + `biography_items` timeline now actually persisted (fixed: `saveIdentity` previously only wrote the parent row) | MVP |
| Signature (typed/drawn) | ✅ Built — `digital_signatures` sub-rows now persisted via `saveIdentity`; verified the `account_id`-based upsert handles both new and existing identities correctly | MVP |
| ~~Avatar~~ | N/A — intentionally not part of Adjung. Identity is carried by Signature, not a photo. | — |

### Publication Engine
| Capability | Status | Required |
|---|---|---|
| Draft | ✅ Built | MVP |
| Publish | ✅ Built | MVP |
| Archive | 🚧 Partial — `status: 'Archived'` exists in schema, no UI action wired yet | Beta |
| Version History (Revisions) | 📜 Spec only — `revisions` table exists in schema, no read/write code | v2 |
| Scheduled Publish | ❌ Not started | v2 |
| Withdraw | ❌ Not started | Beta |

### Writing Engine
| Capability | Status | Required |
|---|---|---|
| Rich text (basic) | ✅ Built (`RichTextEditable.tsx`) | MVP |
| Footnote | 🚧 Partial — data model + inline `[^ref]` parsing exists; needs re-verification post-Supabase migration | MVP |
| Gloss / interlinear (RTL) | 🚧 Partial — CSS + parser exist (`rtlTypography.css`, typography engine), needs live test | Beta |
| Citation | 🚧 Partial — `citationStyles.tsx` + `ReferenceLibrary.tsx` exist, not yet wired to Supabase `citations`/`entry_citations` tables | Beta |
| References list | 🚧 Partial — same as above | Beta |
| Images | 📜 Spec only — no upload/storage pipeline built (no Supabase Storage bucket configured) | Beta |
| Tables | 🚧 Partial — basic block renderer exists | v2 |
| Autosave | ✅ Built — was already fully implemented (debounced 1500ms, `saveStatus`/`lastSavedTime` tracking, 50+ field-level trigger points) before this matrix was first written; the initial "Not started" entry was a wrong assessment made without reading the 3,700-line `EntryRenderer.tsx` closely. Verified live: typed into a title field, never clicked Save, confirmed the row updated in Supabase within ~2s. | MVP |
| Undo | ❌ Not started | v2 |

### Reading Engine
| Capability | Status | Required |
|---|---|---|
| Reading width / typography | ✅ Built | MVP |
| Footnote popup | 🚧 Partial | MVP |
| Margin note | 🚧 Partial (`margin_notes` table wired in `supabaseService`) | MVP |
| Gloss hover | 🚧 Partial | Beta |
| Citation popup | ❌ Not started | Beta |
| Reading progress indicator | ❌ Not started | v2 |

### Search Engine
| Capability | Status | Required |
|---|---|---|
| Full-text search | ✅ Built — was already live (`EditorialIndex.tsx`, the "Index" view) as a client-side filter over title/author/type/tags/slug/id. Gap found and closed: it never matched the entry's actual body `content`, which is the one field a reader most expects to search. Added, verified live (searched a word that only appears in an entry's body, confirmed it now surfaces). | MVP |
| Filter by tag/author/type | ❌ Not started | Beta |

### Notification Engine
| Capability | Status | Required |
|---|---|---|
| Mentions | ❌ Not started | v2 |
| Editorial notifications | ❌ Not started | v2 |
| System toast (in-app) | ✅ Built (`showToast`) | MVP |

---

## 5. Layer 2 — Editorial Composition Engine

**This is the highest-risk layer.** SPEC-027 documents an extremely sophisticated 10-stage composition pipeline (Blueprint, Spatial Grammar, Editorial Rhythm, Stanza, Composition Budget, Layout IR). None of it is implemented — the only related code (`editorialLayoutEngine.ts`, `blockSpecifications.ts`) governs the internal layout of a *single* entry (signature/footnote/pull-quote placement), not the multi-publication page composition SPEC-027 describes.

| Capability | Status | Required |
|---|---|---|
| Composition Engine (multi-pub layout merge) | 📜 Spec only (SPEC-027) | v2 |
| Blueprint Engine | 📜 Spec only (SPEC-027) | v2 |
| Masonry / card grid | ❌ Not started (Frontpage currently uses simple stacked cards) | Beta (simple grid), v2 (full masonry) |
| Editorial Rhythm | 📜 Spec only (SPEC-027) | v2 |
| Stanza Engine | 📜 Spec only (SPEC-027) | v2 |
| Reserved Editorial Slots | 📜 Spec only (SPEC-027) | v2 |
| Hero selection | 🚧 Partial — `featuredEntryId`/`featuredScholarId` single-slot only, no grid | MVP (single slot is enough) |
| Featured Engine | 🚧 Partial — same as above | MVP |
| Section management | ❌ Not started | v2 |
| Frontpage curation (single featured item) | ✅ Built (basic — one featured entry via Editorium) | MVP |
| Recommendation Engine | ❌ Not started | v2 |

**Recommendation:** Do not attempt SPEC-027's full pipeline before Beta. The current single-slot "Featured Entry" mechanism is sufficient for MVP and Beta. Revisit Composition Engine only once there are enough real publications that manual curation becomes painful.

---

## 6. Layer 3 — Knowledge Engine

| Capability | Status | Required |
|---|---|---|
| Reference/Citation storage | 🚧 Partial (schema exists, UI not wired) | Beta |
| Cross-reference between entries | ❌ Not started | v2 |
| Tag engine | 🚧 Partial (`tags text[]` column exists, no tag browsing UI) | Beta |
| Topic taxonomy | ❌ Not started | v2 |
| Index / directory of all published works | 🚧 Partial (`EditorialIndex.tsx`, `Directory.tsx` exist, still on old mockDb path) | MVP |
| Knowledge Graph | ❌ Not started | Future (Layer 8, per roadmap) |

---

## 7. Layer 4 — Asset Engine

| Capability | Status | Required |
|---|---|---|
| Image upload | ❌ Not started — no Supabase Storage bucket, no upload UI | Beta |
| Cover image | ❌ Not started | Beta |
| Thumbnail generation | ❌ Not started | v2 |
| Media optimization | ❌ Not started | v2 |

Per the Constitution, Adjung is text-first — most entries will never need this layer. Low urgency.

---

## 8. Layer 5 — UI Engine

| Capability | Status | Required |
|---|---|---|
| Design language (serif/maroon scholarly theme) | ✅ Built (`index.css`, custom — not Material/iOS) | MVP |
| Responsive layout | 🚧 Partial — desktop-first, mobile not systematically tested | MVP |
| Navigation | ✅ Built | MVP |
| Dialog/Modal | ✅ Built | MVP |
| Toast | ✅ Built | MVP |
| Keyboard shortcuts | ❌ Not started | v2 |
| Accessibility (ARIA, focus trap) | ❌ Not started — flagged as a governance rule in SPEC-099 but not yet enforced | Beta |
| Dark mode / theme switching | ❌ Not started | v2 |

---

## 9. Layer 6 — Institutional Engine

| Capability | Status | Required |
|---|---|---|
| Notices | 🚧 Partial (`NoticesView.tsx` exists, still on old mockDb path) | Beta |
| Editor's Notes | 🚧 Partial (`EditorialNotesView.tsx` exists, still on old mockDb path) | Beta |
| Publishing Policy display | ✅ Built (static content, migrated) | MVP |
| Changelog | 🚧 Partial (`ChangelogView.tsx` exists, still on old mockDb path) | Beta |

---

## 10. Layer 7 — Administration

| Capability | Status | Required |
|---|---|---|
| Editorium dashboard | 🚧 Partial — fully migrated to Supabase (no more mockDb/Firestore calls), verified live (policies, board members, settings all read/write correctly). Still one 2,600-line monster file — not yet split into per-tab components | MVP (functionally done), Monster Component split still pending |
| User management (suspend/role change) | ✅ Built (via `AppContext`, Supabase-backed) | MVP |
| RBAC enforcement | ✅ Built (`role_permissions` in `system_settings`, seeded) | MVP |
| Audit log | ✅ Built — `system_logs` write path (`logAction`) wired and verified | Beta |
| Moderation queue | ❌ Not started | v2 |
| Admin-curated reserved username blocklist (offensive terms, trademarks, etc., editable by Chief Editor — distinct from the hardcoded technical `RESERVED_PATHS` list that already protects system routes) | ❌ Not started | Beta — not needed while registration is invite-only to trusted individuals; matters once self-registration opens to the public |
| Analytics | ❌ Not started | v2 |

---

## 11. Layer 8 — Future

AI writing assistant, translation, peer review, institutional accounts, public API, RSS, plugins — all ❌ Not Started, all correctly deferred per SPEC-099 Phase 7 and beyond. No action needed before launch.

---

## 12. What This Means for Sequencing

Cross-referencing this matrix against the required column gives the actual MVP scope — much smaller than the full spec set:

**True MVP blockers (must finish before any real user touches this):**
1. ~~Finish Supabase migration on remaining components~~ — ✅ Done. All components migrated; verified live (login, Folio, Editorium, policies, board members, signature persistence, audit log all confirmed working against real Supabase data).
2. ~~Real Auth account creation on signup~~ — ✅ Code fixed. Both `SignUpWizard` (real password field added, min 8 chars) and the invite-simulate flow now call `supabase.auth.signUp()` before creating any `users`/`profiles`/`identities` rows, and link `auth_user_id` correctly. Verified defensively: a failed signup (bad email, rate limit) correctly aborts with a toast and creates zero orphaned DB rows. **Not yet verified as a full live round-trip** (signup → confirm email → login) — blocked by Supabase's default email rate limit, not a code issue. **Follow-up needed before Beta:** "Confirm email" is kept ON (user's choice, more secure) — this means custom SMTP must be configured in Supabase before real invite-only users are onboarded, since the default Supabase email sender is rate-limited to a handful of emails/hour.
3. ~~Digital signature save path~~ — ✅ Done. `saveIdentity` now writes `digital_signatures` and `biography_items` sub-rows, not just the parent identity row.
4. ~~Autosave in the editor~~ — ✅ Done, verified live. Also fixed a **critical blocker discovered while testing it**: `generateUUID()` in `utils.tsx` was generating legacy-format pseudo-IDs (`entry-xxxx-...`, a leftover from the mockDb/Firestore era) instead of real UUIDs — this silently broke **every** new entry creation, since Postgres rejects them for the `uuid`-typed `id` column. Fixed at the source (now uses `crypto.randomUUID()`); this function is called from 4 files, so the one fix repairs entry creation, biography milestones, and revision snapshots all at once.
5. ~~Basic search~~ — ✅ Done, verified live (see Search Engine section above — body-content matching was the missing piece, now fixed).
6. ~~Subdomain routing~~ — ✅ Was already ~90% built (not visible from a quick read — the full route table for `/`, `/bio`, `/identity`, `/desk`, `/policies`, `/note|essay|article/:slug` was already implemented in `App.tsx`, correctly resolving entries scoped to the subdomain's author). The only real gap was that hostname parsing only recognized production-style 3-part hostnames (`sub.adjung.com`), so it could never be tested locally. Fixed to also accept the `sub.localhost` 2-part form modern browsers resolve to 127.0.0.1 natively. Verified live: `izzatanas.localhost:3000` → Folio, `/bio` → Biography, `chatgpt.localhost:3000/article/untitled-article-2361` → the correct published article, all with zero manual navigation. **Cross-subdomain auth — implemented, not fully verifiable locally.** Replaced Supabase's default localStorage session storage with a custom cookie-based adapter (`src/utils/cookieStorage.ts`) scoped to the root domain (`Domain=adjung.com` in production, so the cookie is shared by every `*.adjung.com` subdomain per standard RFC 6265 domain-matching — this is the same mechanism used by most real multi-tenant subdomain platforms). Confirmed the cookie writes correctly on login. **Could not confirm it is actually read cross-subdomain locally** — Chrome does not extend `Domain=localhost` cookies across `*.localhost` subdomains the way it does for real multi-label domains, so `izzatanas.localhost:3000` still showed signed-out after logging in on `localhost:3000`. This is a `*.localhost`-specific browser quirk, not a flaw in the approach — needs re-verification once deployed to the real `adjung.com` domain (see item 8).
7. ~~Delete dead code~~ — ✅ Done. `mockDb.ts`, `firestoreService.ts`, `authService.ts`, `config/firebase.ts` deleted; `server.js` rewritten (SQLite removed, only the Google Doc proxy remains); `firebase`/`sqlite3` npm packages uninstalled.
8. Deploy somewhere real
9. **(found during testing, not originally listed)** "Switch Scriptor" (act-as-AI-account) modal was coded but never wired into `App.tsx` — ✅ Fixed and verified end-to-end (switch to Claude, banner shows correctly, revert to original account works).

**Also fixed — real production bugs found only by testing, not visible from reading code:**
- Anonymous visitors triggering the Google Doc auto-refresh cache write would silently abort the *entire* state sync (RLS failure was uncaught) — now fails gracefully and skips just that write.
- Izzat Anas's `users` row was never linked (`auth_user_id`) to his real Supabase Auth account — meant every Chief-Editor-gated write silently failed even while fully logged in. Fixed via SQL; this same gap will hit every future signup until blocker #2 above is fixed.

**Still fully dead-weight (0% built, per SPEC-027):** Composition/Blueprint/Rhythm/Stanza Engine — correctly out of scope until Beta.

**Fixed:** All 10 `window.confirm()` call sites across `Editorium.tsx`, `EntryRenderer.tsx`, `BiographyView.tsx`, `SignatureManager.tsx` replaced with a reusable `ConfirmDialog` component, wired through `AppContext.requestConfirm()` (same pattern as `showToast`). Verified live — renders correctly in Adjung's own visual style, no longer blocks the JS thread.

**Explicitly NOT MVP** (do not start before Beta, regardless of how detailed the spec is):
- Composition/Blueprint/Rhythm/Stanza Engine (SPEC-027) — use single-slot Featured Entry instead
- Image/asset pipeline
- Knowledge Graph
- Recommendation Engine
- Notifications
- Moderation queue, analytics

---

## 13. Maintenance

Update this matrix whenever a capability changes status. This document — not a spec's aspirational text — is what determines "are we ready to launch."
