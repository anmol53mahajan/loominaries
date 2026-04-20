# Loominaries

Loominaries is an AI-powered Model United Nations delegate strategy suite built to help delegates research agendas, analyze speeches in real time, track alliances, and manage live-session notes in one production-ready workspace.

## Problem Statement

MUN delegates often need to switch between scattered tools for research, note-taking, alliance tracking, and live debate analysis. Loominaries centralizes these workflows into a single SaaS-style platform so delegates can move faster and make better strategic decisions during committee sessions.

## Features

- AI Research Hub
  - Context-aware chat with strategic drafting tools
  - Opening speech, POI, and position idea generation
  - Resource Library with Firestore-backed CRUD
- War Room
  - Real-time speech analysis
  - POIs and POOs with selectable cards and history
  - Live tracker for countries and engagement history
  - Verbatim speech saving to Resource Library
- Alliance Tracker
  - Country CRM for alliances, opposition, and voting patterns
  - Real-time Firestore sync
  - Bloc strength analytics and majority path visualization
- Strategy Notepad
  - Auto-saving distraction-free writing space
  - Debrief notes, speech drafts, and quick ideas
  - Live note syncing with Firestore

## Tech Stack

- React (Vite)
- Firebase Authentication
- Cloud Firestore
- Tailwind CSS
- Groq AI API
- Framer Motion
- React Router
- React Hot Toast

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create a root `.env` file using the variables from `.env.example`.

3. Add your Firebase and AI credentials:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_GROQ_API_KEY=your_groq_api_key
VITE_GROQ_MODEL=llama-3.1-8b-instant
VITE_GROQ_FALLBACK_MODEL=llama-3.3-70b-versatile
```

4. Run the development server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Firebase Collections

- `committees` - committee setup per user
- `resources` - research links and saved AI outputs
- `countries` - alliance tracker CRM data
- `notes` - auto-saving strategy notepad content
- `sessions` - live War Room engagement tracking

## Screenshots / GIFs

Add product screenshots or GIFs here for the final demo.

## Notes

- Firestore rules must be published before the CRM, notepad, and War Room features can persist data.
- AI calls are routed through Groq using the configured API key in `.env`.
- The app is designed to be responsive and usable on tablet and mobile layouts.
