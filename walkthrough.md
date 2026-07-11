# Walkthrough - Serverless Firebase Firestore & Authentication Migration

We have successfully migrated the Adjung Scholarly Scriptorium database and authentication layer from a local SQLite engine and Express API server to a serverless Firebase structure. This enables deployment on Vercel with wildcard subdomain support for RM0 / $0 monthly cost.

## Key Changes Made

### 1. Firebase Configuration & Initialization
- **Config Template**: Created [firebase.ts](file:///c:/Users/alkut/adjung-platform-1/src/config/firebase.ts) to initialize the Firebase Client SDK.
- **TypeScript Alignment**: Casted `import.meta` as `any` to satisfy Vite's compiler settings.

### 2. Vercel Serverless Scraper Bypass
- **Bypass CORS**: Created [fetch-doc.js](file:///c:/Users/alkut/adjung-platform-1/api/fetch-doc.js) as a serverless Vercel function in the root `/api` folder. This handles backend web scraping of published Google Docs (for News, Holidays, and Curation), completely bypassing browser CORS restrictions on the client side.

### 3. Serverless Firestore Query Service
- **Direct Queries**: Created [firestoreService.ts](file:///c:/Users/alkut/adjung-platform-1/src/utils/firestoreService.ts) containing client-side Firestore methods to read and write directly to Firestore collections (`users`, `profiles`, `entries`, `identities`, `system_settings`, `logs`).

### 4. Direct Firebase Auth & App State Integration
- **Auth Service Upgrade**: Updated [authService.ts](file:///c:/Users/alkut/adjung-platform-1/src/services/authService.ts) to utilize standard Firebase Authentication. It features a "Lazy Auth Creation" mechanism to authenticate legacy users automatically and registers new signups securely.
- **Context Layer Migration**: Updated [AppContext.tsx](file:///c:/Users/alkut/adjung-platform-1/src/context/AppContext.tsx) to substitute local `/api/*` Express endpoints with direct Firebase Firestore and Auth calls. Added a reactive auth state listener (`onAuthStateChanged`) that automatically manages user sessions and updates client-side mock caches seamlessly.
- **Component Cleanups**: Removed old fetch calls and replaced them with `firestoreService` calls inside [Editorium.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/studio/Editorium.tsx), [IdentityStudio.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/portal/IdentityStudio.tsx), [FolioView.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/portal/FolioView.tsx), [BiographyView.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/portal/BiographyView.tsx), [EntryRenderer.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/rendering/EntryRenderer.tsx), and [App.tsx](file:///c:/Users/alkut/adjung-platform-1/src/App.tsx).

### 5. Data Migration Script
- **Seamless Transition**: Created [migrateToFirestore.js](file:///c:/Users/alkut/adjung-platform-1/scripts/migrateToFirestore.js) to automate migrating all your SQLite data (users, profiles, identities, entries, settings) from your local `adjung.db` straight into your cloud Firestore database.

---

## Verification & Deployment Guidelines

### 1. Configure Local Environment Variables
Create a file named `.env` in the root folder of your project and paste your Firebase credentials (retrieved from your Firebase Console -> Project Settings):
```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

### 2. Run the Data Migration Script
To migrate your existing local SQLite data to your new Firestore cloud database, simply run:
```bash
node scripts/migrateToFirestore.js
```
*Note: Make sure your `.env` variables are configured before running the script!*

### 3. Deploying to Vercel
1. Install the Vercel CLI locally (or link your GitHub repository to your Vercel Dashboard).
2. Add the above `VITE_FIREBASE_*` environment variables in your Vercel project settings.
3. Add your custom domain `adjung.com` and setup a wildcard domain `*.adjung.com` in Vercel.
4. Deploy the build. Vercel will automatically compile the React frontend and launch the `/api/fetch-doc` serverless API.

---

## Member Registration Date (Joined) & Sorting Feature

### 1. Database Schema Extension
- Added `createdAt` field of type `TEXT` to the `users` SQLite database table (with automatic migration fallback).
- Populated default registration dates for existing seed scholars (ranging from `2026-06-25` to `2026-06-29`).
- Added support for migrating the `createdAt` attribute to Firebase Firestore in the `migrateToFirestore.js` script and sync logic in `firestoreService.ts`.

### 2. Public Directory Display
- Added a new **Joined** column to the public Directory table.
- Renders only the date portion (e.g., `YYYY-MM-DD`).

### 3. Member Sorting Capabilities
- Added new sorting options to the directory dropdown:
  - **Date Joined (Newest)**: Displays the newest members first.
  - **Date Joined (Oldest)**: Displays the oldest members first.
- Re-aligned table headers (e.g. aligning left for data cells and headers) to preserve premium typography styling.

---

## Access Controls & Restricted Views

### 1. Unified Restricted Access Interface
- **Matching Design**: Created [RestrictedAccessView.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/common/RestrictedAccessView.tsx) mimicking the exact visual grid, typography, borders, shadows, and actions of the official `LoginModal`.
- **Portal Protection**: Configured [App.tsx](file:///c:/Users/alkut/adjung-platform-1/src/App.tsx) to block guest access to the `/directory` and `/index` portal routes, displaying the elegant `RestrictedAccessView` box in their place rather than rendering blank screens.

### 2. Collapsed Content Protection
- **Facebook-style Gate**: Modified [FolioView.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/portal/FolioView.tsx) timeline event listeners (note expansions, essay titles, and read buttons) to verify session status. If unauthenticated, it triggers the sign-in modal automatically with a clear prompt requesting registration.

### 3. Chief Editor Firestore Profile Fixes
- **Data Rectification**: Created [fixIzzat.js](file:///c:/Users/alkut/adjung-platform-1/scripts/fixIzzat.js) to resolve a malformed string array schema on the `lifeTimeline` and `signatures` properties in Firestore.

### 4. Spacing & Alignment in Signature Studio
- **Vertical Alignment**: Restructured [SignaturePad.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/desk/SignaturePad.tsx) to align the mode toggles and input boxes to the top (`items-start`), preventing misalignment caused by the helper text below the input field.
- **Top-right Close Button**: Added an elegant, dedicated close button in the top-right corner of the modal wrapper that behaves responsively and does not overlap with the signature inputs.

### 5. Biography Readability & Typography Contrast
- **Font Weight Adjustment**: Changed the body text container in [BiographyView.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/portal/BiographyView.tsx) from `font-light` (font-weight: 300) to `font-normal` (font-weight: 400).
- **Text Color Contrast**: Increased text contrast by changing the text color class from `text-stone-800` to `text-stone-900` for highly legible, fatigue-free reading.

### 6. Biography Metadata Alignment
- **Centering Pen Name**: Fixed the alignment mismatch in [BiographyView.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/portal/BiographyView.tsx) by adding `justify-center` to the Pen Name flex container. This ensures that the Pen Name value matches the centered alignment of the signature, full name, affiliation, and email contact fields.

### 7. Biography Milestone Data Persistence (Firestore Sync)
- **Firestore Saves**: Modified `handleAddBioItem` and `handleRemoveBioItem` in [App.tsx](file:///c:/Users/alkut/adjung-platform-1/src/App.tsx) to be asynchronous and call `firestoreService.saveIdentity` before updating the local state. Previously, milestones were only updated in local memory and instantly overwritten with stale server data when `refreshDbState` was triggered, causing new/deleted milestones to disappear after one second.

### 8. Premium Editorial Timeline Layout
- **Container Cleanup**: Replaced the generic box borders, shadows, and background container in [BiographyView.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/portal/BiographyView.tsx) with a minimalist editorial timeline flow. Milestones now sit directly on the clean Adjung paper background.
- **Badge & Spacing**: Styled the milestone categories into elegant, subtle red labels (`text-[#802334]`) with a very light background. Adjusted year and text typography margins to create a natural, academic visual rhythm.
- **Hover to Reveal**: Configured the "Delete Milestone" button to float with `opacity-0 group-hover:opacity-100` so that the public-facing view remains clean and un-cluttered.

### 9. AI Scholar Identity Badges
- **Personal Masthead**: Added an elegant, inline `AI Fellow` badge next to the scholar's pen name in the masthead of [App.tsx](file:///c:/Users/alkut/adjung-platform-1/src/App.tsx) when viewing an AI writer's personal site.
- **Navbar Profile Dropdown**: Displayed an inline `AI` badge next to the user's pen name inside the navigation dropdown of [Navbar.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/common/Navbar.tsx) when logged in as an AI scholar, establishing clear role context.

### 10. Local Session Sync Cache Fix
- **Session Update**: Added `SessionService.createSession(found, true)` in [AppContext.tsx](file:///c:/Users/alkut/adjung-platform-1/src/context/AppContext.tsx) inside the database state refresh block. This ensures that the stale `localStorage` user object (which lacked the `isAi: true` flag) is updated immediately when the database finishes syncing, preventing cached data desync without requiring manual sign-outs.

### 11. Minimalist rotating Sparkles Icon with Tooltip
- **Esthetics & Interaction**: Replaced the system text badges `[AI]` and `[AI Fellow]` with a subtle, editorial maroon Sparkles icon (✦) that smoothly spins 360 degrees when hovered (`transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]`). On hover, an elegant, dark, font-mono custom tooltip smoothly fades in. Applied across the personal masthead ([App.tsx](file:///c:/Users/alkut/adjung-platform-1/src/App.tsx)), navigation user menu ([Navbar.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/common/Navbar.tsx)), writer directory table ([Directory.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/portal/Directory.tsx)), and biography credentials card ([BiographyView.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/portal/BiographyView.tsx)).
- **Redundancy Clean-up**: Deleted the redundant `AI Scriptor` / `AI Editorial Scriptor` badge from the sub-heading area of [FolioView.tsx](file:///c:/Users/alkut/adjung-platform-1/src/components/portal/FolioView.tsx) to prevent duplicate labeling and clean up the visual flow.
