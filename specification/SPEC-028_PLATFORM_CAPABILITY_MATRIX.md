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
| UI System spec | 🚧 Partial — "Adjung Design System v2.0" (2026-07-17, same day as v1.0, revised same session) adds Philosophy (7 numbered Design Principles), an Editorial System chapter (11 named objects — Reading Width, Footnote/Margin Note/Interlinear Gloss, Citation, Reference, Figure, Biography, Folio, Issue/Edition confirmed not built — each with file:line evidence), semantic token naming mapped to Tailwind, and an Accessibility report card, on top of v1.0's Foundation/Component audit. Lives as a Claude Artifact, not yet a numbered spec doc in this folder — ask Izzat before formalizing it as one. **Rollout has started**: all 8 items in the doc's rollout plan are implemented (see Design language + Accessibility rows below), not just the shade-class fix. | Beta |

---

## 4. Layer 1 — Core Engine (Implementation)

### Identity Engine
| Capability | Status | Required |
|---|---|---|
| Login (Supabase Auth) | ✅ Built, verified live | MVP |
| Register (real account, not just DB row) | ✅ Built and **fixed live 2026-07-17** — signup was silently broken at the database level until this pass, for two independent reasons, both now fixed and verified with real accounts through the full wizard: (1) `newUserId` was a non-UUID string (`user-alex-morgan`) against a strict `uuid` column — every signup failed with a Postgres type error before ever reaching a policy check; (2) `users` had an UPDATE policy and a Chief-Editor-only ALL policy, but **no INSERT policy** — RLS's default-deny meant self-signup could never create its own row even once the UUID bug was fixed (`supabase/migrate_add_users_self_insert_policy.sql`, scoped to `role = 'Writer'` so a client can't self-assign Editor/Chief Editor). `SignUpWizard` was also rebuilt this pass — see the new "Account Setup" entry below. Invite-simulate flow (`handleCompleteRegistration`) is untouched and still carries the old string-based `newUserId` — a known, flagged, out-of-scope follow-up. | MVP |
| Session persistence | ✅ Built | MVP |
| Email verification | ❌ Not started — Supabase's own "Confirm email" is currently **disabled** (was hitting the built-in mailer's rate limit during testing); the wizard's Step 5 code entry is explicitly labeled DEMO MODE and was never real. Right now nothing verifies a signup email is actually owned by the person registering. Custom SMTP (Resend, domain `mail.adjung.com` — DNS verified) is set up as infrastructure but not yet wired into Supabase Auth. | Beta |
| Account Setup wizard (was "Registration Wizard") | ✅ Rebuilt 2026-07-17 — 10 steps → 8: swipeable "What makes Adjung different?" cards, honest DEMO MODE verification copy, a merged "Your Public Profile" step (biography + personal site + signature, all optional, was a hard gate before), a new "Your Interests" step (topics/languages/edition — feeds the not-yet-built Segment/Composition Engine, see SPEC roadmap discussion). First-time Google OAuth signup added (`pendingOAuthProfile` handoff in `AppContext`) sharing the same step components via a flow-array refactor (`STANDARD_FLOW` vs `OAUTH_FLOW`). Google provider itself is registered in code but **not yet enabled** in the Supabase dashboard — clicking "Continue with Google" will currently fail until that's turned on. | MVP |
| Biography | ✅ Built — `identities.biography` + `biography_items` timeline now actually persisted (fixed: `saveIdentity` previously only wrote the parent row) | MVP |
| Signature (typed/drawn) | ✅ Built — `digital_signatures` sub-rows now persisted via `saveIdentity`; verified the `account_id`-based upsert handles both new and existing identities correctly. **Rendering consolidated to a single source of truth**: an audit found the signature (Adjung's only identity marker — no avatars) was rendered independently in ~5 places with diverging math (BiographyView's typed branch, the signup wizard's preview, two EntryRenderer plain-text fallbacks, Editorium's board-member panel). All now route through `SignatureRenderer.tsx` with its full prop set; deleted a dead, math-divergent `signatureCompiler.ts`; the four duplicated `resolveSignature*`/`resolveDigitalSignature` helpers extracted to `src/utils/signatureResolvers.ts`. Verified live: BiographyView and EntryRenderer now render identically (same ink-bleed styling). **Deferred, not yet done**: the three signature *capture* implementations (`SignaturePad.tsx`, `MobileSignCanvas.tsx`, `SimulatedMobileCanvas.tsx`) still use different pressure-physics formulas, so a signature drawn via desktop vs. mobile QR-sync carries different pressure data even though playback is now consistent — capture-side unification is a separate, higher-risk piece of work (touches already-saved signatures) not attempted in this pass | MVP |
| Mobile QR signature sync (draw on phone, sync to desktop wizard) | ✅ Built — was Firestore-only in the Antigravity branch (`Step8Signature.tsx` + `MobileSignCanvas.tsx` imported `firebase/firestore` directly, a leftover that would not have compiled against this project's Supabase-only stack). Rewired to Supabase Realtime Broadcast channels (`signature_sync:{sessionId}`) — no new table needed, this is transient handshake data. | MVP (part of signup) |
| ~~Avatar~~ | N/A — intentionally not part of Adjung. Identity is carried by Signature, not a photo. | — |
| Switch Scriptor / Acting Account | 🚧 Partial — **critical silent-failure bug found and fixed 2026-07-17.** `switchActingAccount()` (`AppContext.tsx`) only ever swaps `currentUser` client-side; it never re-authenticates with Supabase. So any RLS-protected write made while "acting as" an AI Scriptor (Folio hero/subtitle via `saveProfile`, biography/signature via `saveIdentity`) was silently rejected — the write is attributed to the AI account's id, but `auth.uid()` (and `current_app_user_id()`) still resolves to the real session underneath, so the existing "Authors manage own X" policies matched zero rows and no error surfaced. Reported by the Chief Editor as "Save Profile does nothing" with no visible error, confirmed by reading the RLS policies directly rather than live-reproducing it. Fixed by extending the already-proven "Editors manage all entries" pattern (`policies.sql`) to `profiles`/`identities`/`biography_items`/`digital_signatures`, scoped strictly to `is_ai = true` accounts — Editors/Chief Editor gain no new access to a real writer's own data, only to the AI personas "Switch Scriptor" already restricts itself to. **Migration not yet run live** — `supabase/migrate_add_editor_manage_ai_accounts_policy.sql` needs to be executed in the Supabase SQL editor before this is actually fixed in production, same as the earlier signup RLS gap this session. | MVP |

### Publication Engine
Scholarly content types are now `Note | Essay` only — `Article` was removed platform-wide (product decision, confirmed by Chief Editor). `entries.content_type` CHECK constraint updated accordingly (`supabase/migrate_drop_article_type.sql`), including converting the one pre-existing `Article`-typed entry to `Essay`.

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
| Footnote | 🚧 Partial — **real bug found and fixed 2026-07-17**: right-click → Insert Footnote/Margin Note/Interlinear Gloss used `document.caretRangeFromPoint()` (always a *collapsed* caret) in preference to the user's actual text selection, so the selected word was silently discarded on every insertion. Fixed in `handleContextMenu` to prefer a live non-collapsed selection first, falling back to click position only when nothing is selected. Also added a guard in `insertNote()` so a missing range now aborts cleanly instead of writing an orphaned note (footnote/margin-note text with no visible marker anywhere in the entry). Live insertion via the browser UI itself could not be fully exercised through browser automation in this pass (the floating toolbar/context-menu's click targets were not reliably clickable by the automation tooling used) — the underlying selection-handling bug is fixed and verified by code path, but ask Izzat to do one real manual insertion to confirm the UI itself feels right. | MVP |
| Gloss / interlinear (RTL) | 🚧 Partial — same root-cause fix as Footnote above (shared `handleContextMenu`). Previously **could never actually use the word you selected** — `insertInterlinearVisual()` reads `range.toString()` for the word to gloss, and a collapsed range always stringifies to `''`, so it silently fell back to `window.prompt("Enter word to be glossed:")` on every use, defeating the point of selecting text first. Now receives the real selected word. Same manual-verification caveat as Footnote above. | Beta |
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
| Margin note | 🚧 Partial (`margin_notes` table wired in `supabaseService`). **Two things verified/fixed 2026-07-17**, prompted by Izzat's specific worry about a long margin note visually colliding with the next paragraph's note: (1) confirmed via an isolated CSS test replicating `ElasticMarginRow`'s exact desktop grid layout that this does **not** happen — each paragraph is an independent CSS Grid row that auto-expands to its own tallest content in normal block flow, so a long note simply grows its own row's height and the next row starts cleanly below with zero overlap, no matter how long the note gets. (2) Found and fixed a real, separate bug: a paragraph with *two or more* `[^mn-xxx]` markers only ever rendered the first one (`mnMatches[0]`) — every additional margin note on the same paragraph was silently dropped. `EntryRenderer.tsx`'s view-mode renderer now collects all matches and stacks them within the one margin column, each labeled with its own roman numeral. | MVP |
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

**IA decided in principle, 2026-07-17 (no code yet):** Adjung = **Portal** (institutional/collective) + **Personal Site** (per-writer, already built). Portal = **Frontpage** (single front door, already built) + **Segment** (curated sub-publications). A Segment is one of three types, each along a different axis — **Edition** (geography, e.g. "Malaysian Edition"), **Magazine** (general topic, broad audience, e.g. "Health Magazine"), **Journal** (specialized discipline, scholarly register, e.g. "Journal of Hadith"). A publication may belong to multiple Segments at once. For multilingual content, **rejected** a reader-side silent-filter model (fragments the composition into a viewer-dependent feed, contradicting Adjung's own anti-algorithmic-feed philosophy) in favor of **named Language Editions as first-class fixed compositions** — e.g. "Health Magazine (EN)" and "Health Magazine (MS)" are each independently singular and editor-owned, and a reader is *routed* to the one matching their `identities.preferred_languages` (already captured at signup), never shown a live-filtered subset. Cross-language inclusion is a deliberate editorial act (commission a translation) not a technical default. For now, agreed to ship a **single mixed-language version only** (API/translation cost not justified yet) — the two-Edition (native + English-pivot) model is the next step once that's affordable, with per-entry language *labeling* (free, no API) as the interim bridge so readers at least know why a piece is unreadable to them. This whole layer, including Segment/Edition, is still 📜 spec-only / discussion — nothing above is implemented.

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
| Design language (serif/maroon scholarly theme) | ✅ Built (`index.css`, custom — not Material/iOS). A bespoke design system blending iOS/Fluent/Material influences was KIV as of 2026-07-16; **actively started 2026-07-17, rollout complete same day** — see the "UI System spec" row in Layer 0 above. Fixed: 175 occurrences across 25 files of Tailwind shade numbers that don't exist in the default palette (compiled to no CSS under JIT, silently falling back to inherited/transparent color) — remapped. Maroon color spelling normalized: `adjung-maroon`/`Adjung-maroon`/raw `[#802334]` (~640 call sites, 48 files) all consolidated to canonical lowercase `adjung-maroon` — pure rename, verified no visual change; the now-unused duplicate `--color-Adjung-maroon` theme token was removed from `index.css`. EntryRenderer's reading width unified to `max-w-4xl` for all content types (was silently narrower for non-Essay entries via a redundant nested `max-w-3xl`). Component-level bugs from the v1.0/v2.0 audit fixed: off-brand primary button (EntryImage), inconsistent card border (WritingDesk), stock-green badges (Step8Signature, SimulatedMobileCanvas), non-maroon active segmented control (ReferenceLibrary RTL toggle), UserGuide's third tab mechanism migrated to the Filled Tab pattern, `FieldTooltip` generalized to accept custom triggers and four hand-copied "AI Editorial Fellow" tooltip duplicates (BiographyView, Directory, Navbar, App.tsx) consolidated into it, FrontpageView's holiday tooltip aligned to the canonical stone-900/opacity-fade visual language. `tsc --noEmit` clean throughout. | MVP |
| Responsive layout | 🚧 Partial — audited and fixed at iPhone viewport (375×812) for Frontpage, Folio, Entry reading view, Directory, Notices/Editor's Notes: Navbar now collapses nav links behind a hamburger menu below `md` instead of wrapping; world clock strip no longer clips both edges (was `overflow-x-auto` + `justify-center` with more content than fits — now left-aligned + scroll-snap on mobile); Directory's entries table already scrolled correctly in its own container, just needed a "swipe to see more" hint. Editorium (admin-only) and the signup wizard not yet audited for mobile. Navbar's mobile menu toggle bumped from 32×32 to 40×40 (touch-target guideline) and its outlier `w-[18px]` icon size folded into the standard `w-4 h-4` step. Also fixed an unrelated dev-only bug found while testing: `server.js` and Vite raced for port 3000 because the dev launcher's ambient `PORT` env var leaked into `server.js`'s fallback — pinned server.js to 5000 in `npm run dev` | MVP |
| Navigation | ✅ Built | MVP |
| Dialog/Modal | ✅ Built. **2026-07-17**: added a shared `useModalA11y` hook (Escape-to-close, Tab/Shift+Tab focus trap, auto-focus first field) wired into every modal (ConfirmDialog, AccountModal, LoginModal, SwitchScriptorModal) — previously all four were mouse-only with zero keyboard support. Close-button treatment standardized to a top-right lucide `<X>`: SignUpWizard's hand-rolled inline SVG replaced, and LoginModal/AccountModal/ConfirmDialog (previously Cancel-button-only) each gained one. | MVP |
| Toast | ✅ Built | MVP |
| Keyboard shortcuts | ❌ Not started | v2 |
| Accessibility (ARIA, focus trap) | 🚧 Partial — **2026-07-17**: focus trap done (see Dialog/Modal row above). A global `focus-visible` ring (box-shadow-based, doesn't fight the ~138 existing `outline-none` call sites) and a `prefers-reduced-motion` rule were added platform-wide in `index.css`, both previously absent entirely. `aria-label` added to the highest-traffic icon-only controls (EntryActionsMenu's "..." trigger, FloatingFormatToolbar's Bold/Italic/Underline/Link/Gloss/Footnote/Cancel buttons, Navbar's mobile toggle already had one). Full retrofit of the remaining ~280 icon-only buttons found with no `aria-label` in the original audit is still Phase 2, not started. Still flagged as a governance rule in SPEC-099 for the parts not yet enforced. | Beta |
| Dark mode / theme switching | ❌ Not started | v2 |

---

## 9. Layer 6 — Institutional Engine

| Capability | Status | Required |
|---|---|---|
| Notices | ✅ Built — `NoticesView.tsx` is Supabase-backed (the "still on old mockDb path" note was stale; `mockDb.ts` no longer exists in the codebase at all). Verified live at mobile viewport, empty state renders cleanly | Beta |
| Editor's Notes | ✅ Built — same correction as Notices; verified live | Beta |
| Publishing Policy display | ✅ Built (static content, migrated) | MVP |
| Changelog | ✅ Built — same correction as Notices | Beta |

---

## 10. Layer 7 — Administration

| Capability | Status | Required |
|---|---|---|
| Editorium dashboard | ✅ Built — fully migrated to Supabase (no more mockDb/Firestore calls), verified live (policies, board members, settings, user suspension search all read/write correctly). Monster Component concern resolved: split into `Editorium.tsx` + `studio/tabs/{PlatformIdentityTab,FrontpageCurationTab,UserManagementTab,RolesPoliciesTab,SystemLogsTab}.tsx` | MVP |
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

## 11a. Planned — Portal / Segment System

Status: 📜 Spec Only (scoped 2026-07-18, discussed previously with ChatGPT/Gemini outside this codebase). Zero implementation. Recorded here so the scope survives across sessions.

**Concept (Izzat's definition, verbatim intent):** "Portal" is the umbrella nav concept containing **Frontpage** (✅ already built) and **Segment** (❌ not started). A Segment is a themed page that aggregates content around a specific local/topical theme — first three planned: **Malaysian Edition**, **Journal of Hadith**, **IT Magazine**. Each Segment page uses the 6-slot mosaic/bento card layout (Full Horizontal-hero / Horizontal / Vertical / Square / Compact / Bar — see the Folio card redesign artifact, [[project_adjung_folio_mosaic_artifact]] in Claude's memory) to display its content.

**Full target (long-term, not Phase 1):** Segments are populated *automatically*, regenerated daily, from a mix of heterogeneous content types — not just Entries. Confirmed by Izzat: entries, editorial-written blurbs, news items, Qur'an verses/ayat, and images all need to be placeable into mosaic slots. This requires a selection/ranking algorithm deciding what fills which slot each day per segment, plus a scheduled daily regeneration job. This is effectively the "Composition Engine" already flagged elsewhere in this matrix (§11, §12) as out of scope pre-Beta — Segment is a concrete surface for that same deferred engine.

**What's confirmed NOT to exist yet (verified by code audit 2026-07-18):**
- No "Portal" nav concept in code — `src/components/portal/` is just a directory name; `ActiveTabType` (`AppContext.tsx`) has no `portal`/`segment` value.
- No cross-author theme/collection data model — `Entry.tags`/`Entry.editorialCategory` exist but are per-author, single-entry fields only, never used to assemble a themed page spanning multiple authors.
- No real React mosaic grid component — the 6-slot layout exists only as an HTML mockup artifact; only the Full-Horizontal/hero slot's design has been ported into real code, and only into `FolioView.tsx` (a single-author list, not a grid).
- No `/segment/:slug` routing.
- No content-type abstraction for non-Entry mosaic content (news/Qur'an/image blocks).
- No scheduling/cron infrastructure for daily auto-regeneration.

**Agreed phased approach (Izzat's decision, 2026-07-18) — build in this order, do not skip to automation first:**
1. **Phase 1 (next up):** Manual curation, Entries only. New `segments` data model (slug, name, theme) + editor-assigned entry-to-slot mapping (same manual pattern as today's Frontpage curation). Real `/segment/:slug` pages + routing under a new Portal nav concept. Build the remaining 5 mosaic slots as real React components (Vertical/Horizontal/Square/Compact/Bar — currently 0% built), matching the rigor already applied to the finalized FH slot. 3 segments (Malaysian Edition, Journal of Hadith, IT Magazine) created as data once the system works — not 3x separate code paths.
2. **Phase 2:** Add non-Entry content types to the editor's slot-assignment UI — news items, Qur'an verses, images, editorial blurbs. Still manually placed by an editor.
3. **Phase 3:** Automation — a selection/ranking algorithm + scheduled daily regeneration, with editor override remaining available. This is the real "Composition Engine" build-out.

**Explicitly rejected for now:** building full automation (Phase 3) before Phase 1/2 exist — Izzat chose the phased path specifically to get a working, visible surface sooner rather than a longer up-front build with nothing to show.

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
8. ~~Deploy somewhere real~~ — ✅ Done (Hostinger domain + Railway hosting).
9. **(found during testing, not originally listed)** "Switch Scriptor" (act-as-AI-account) modal was coded but never wired into `App.tsx` — ✅ Fixed and verified end-to-end (switch to GPT Scholar, banner shows correctly, revert to original account works).
10. **(git reconciliation, not originally listed)** A separate work session (Antigravity) independently restructured the codebase on GitHub while this Supabase migration was in progress locally — split `SignUpWizard`/`Editorium`/`EntryRenderer` into smaller per-responsibility files, removed the `Article` content type, and rewrote the Constitution to v2.0. Reconciled by resetting to Antigravity's structure as the new base (confirmed by Chief Editor as the authoritative, most-recent product direction) and re-applying the Supabase migration on top, file by file. Found and fixed two regressions introduced by the split: (a) `Step8Signature.tsx`/`MobileSignCanvas.tsx` were new files that imported `firebase/firestore` directly — would not have compiled; rewired to Supabase Realtime, (b) the signup password field was dropped when `SignUpWizard` was split into `signup-steps/*` — re-added to `Step4Identity.tsx`. `tsc --noEmit` is clean; verified live end-to-end post-reconciliation.

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
