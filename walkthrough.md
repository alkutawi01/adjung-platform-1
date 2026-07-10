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
