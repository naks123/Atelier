# Resume Atelier

A Vite + React + TypeScript web app for writing, previewing, duplicating, and managing multiple LaTeX resume versions. The app uses Firebase Authentication + Firestore for per-user storage and a browser-side BusyTeX WebAssembly runtime for PDF compilation.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Firebase Auth (Google sign-in)
- Firestore
- Monaco Editor
- react-pdf
- BusyTeX / `texlyre-busytex`

## Features

- Google sign-in with private, per-user resume storage
- Dashboard with create, open, duplicate, rename, delete, sort, and download actions
- Seeded one-page LaTeX resume template
- Split-pane editor with draggable divider
- Monaco-based LaTeX editing with syntax highlighting
- Debounced autosave to Firestore
- Debounced live PDF compilation with manual recompile fallback
- Collapsible LaTeX compilation log
- PDF download using the current resume title
- Mobile dashboard support with desktop-only editing notice

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your Firebase web app credentials.

3. Download the BusyTeX assets into `public/core`:

```bash
npm run latex:assets
```

4. Start the app:

```bash
npm run dev
```

## Firebase Setup

1. Create a Firebase project.
2. Enable Google Authentication in `Authentication > Sign-in method`.
3. Create a Firestore database in production or test mode.
4. Add a web app in Firebase and copy the config values into `.env.local`.
5. Deploy the Firestore rules in [`firestore.rules`](/Users/rajeshiyer_1/resume-manager-app/firestore.rules:1):

```bash
firebase deploy --only firestore:rules
```

## Environment Variables

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_BUSYTEX_BASE_PATH=/core/busytex
```

## Project Structure

```text
src/
  components/
  data/
  hooks/
  lib/
  pages/
  providers/
  types/
```

## Compile Strategy Note

This build chooses the client-side WASM route so the app can stay serverless on the free tier and compile PDFs directly in the browser.

Tradeoffs:

- The BusyTeX asset download is large, so it is intentionally excluded from git and pulled with `npm run latex:assets`.
- The BusyTeX package is AGPL-licensed. If that license or the asset footprint is unacceptable for your use case, the clean alternative is a server-side compile endpoint such as a Firebase function or Cloud Run service using `tectonic` or `pdflatex`.

## Firestore Data Model

```text
/users/{userId}/resumes/{resumeId}
  title: string
  latexSource: string
  createdAt: timestamp
  updatedAt: timestamp
  lastCompiledAt: timestamp | null
```

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run latex:assets
```
