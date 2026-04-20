# Loominaries

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-BaaS-FFCA28?logo=firebase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-AI-7C3AED)

Loominaries is a production-ready Model United Nations strategy suite built to help delegates research agendas, draft speeches, analyze live debate, track alliances, and manage notes in one professional workspace.

It is designed to feel like a premium SaaS dashboard, not a toy app: dark, clean, fast, responsive, and focused on actual delegate workflows.

## Table Of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Why This Matters](#why-this-matters)
- [Core Features](#core-features)
- [React Requirements Covered](#react-requirements-covered)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Routes](#routes)
- [Feature Walkthrough](#feature-walkthrough)
- [UI and UX Decisions](#ui-and-ux-decisions)
- [Performance Notes](#performance-notes)
- [Submission Checklist](#submission-checklist)
- [Viva Prep Notes](#viva-prep-notes)
- [Known Notes](#known-notes)

## Project Overview

Loominaries combines authentication, AI assistance, Firestore persistence, and real-time session tooling into a single delegate console.

The app supports the full flow of a serious MUN participant:

1. Sign in securely.
2. Set the committee, portfolio, and agenda.
3. Research strategy and generate outputs with AI.
4. Analyze live speeches in the War Room.
5. Track diplomatic relationships and voting positions.
6. Save drafts, notes, and reference material for later use.

## Problem Statement

Model United Nations, or MUN, is a simulation of the United Nations where students represent countries, debate global issues, negotiate with other delegates, and write solutions through speeches, caucuses, and resolutions. In a real MUN session, a delegate has to research the agenda, understand their country's stance, listen carefully to every speech, identify useful points or weak arguments, track allies and opponents, and keep notes ready for the next move.

The problem is that this entire workflow is usually split across too many tools. One app is used for notes, another for research, a spreadsheet is used for alliances, and live debate is still handled manually. That fragmentation slows down preparation, makes live analysis harder, and forces delegates to switch between unrelated tools at the exact moment they need speed, clarity, and confidence.

I have been doing MUNs for the last 5 years and I have done around 20 of them, so I have personally felt this problem for a long time. That experience is what pushed me to build Loominaries. I wanted to create a single workspace that helps delegates stay organized, respond faster, and ultimately perform better in committee. This website is meant to solve a real pain point and help delegates win more through better preparation and smarter live decision-making.

Loominaries solves that by turning the MUN workflow into one coordinated system.

## Why This Matters

This is not just an interface exercise. It addresses a practical problem for real users:

- Delegates need to react quickly during debate.
- Research and note-taking need to stay connected to the committee context.
- Alliance tracking must be persistent and structured.
- Live speech analysis must be usable in real time.
- The final output should look and behave like a real product, not a class demo.

## Core Features

### 1. Authentication System

- Email/password signup and login.
- Google sign-in.
- Protected application routes.
- Session persistence through Firebase Auth.

### 2. Dashboard and Committee Setup

- Store committee name, portfolio, and agenda.
- Load existing committee data from Firestore.
- Use the saved committee context everywhere else in the app.

### 3. Research & AI Intelligence Hub

- Context-aware AI chat.
- Opening speech generation.
- POI generation.
- Position idea generation.
- Resource Library CRUD.
- Save generated AI outputs directly into Firestore.

### 4. War Room / Live Session

- Paste a live speech transcript.
- Analyze it into POIs and POOs.
- Select a POI and jump between items.
- Save selected POIs to Notepad.
- Save verbatim speeches to Resource Library.
- Track countries and log POI history.

### 5. Alliance Tracker CRM

- Add countries manually.
- Mark sentiment as ally, neutral, or opponent.
- Track vote preference.
- Remove countries.
- See bloc strength analytics and majority progress.

### 6. Strategy Notepad

- Single auto-saving workspace.
- Debounced Firestore writes.
- Clean writing-focused layout.
- Useful for speech drafts, rebuttals, clauses, and quick session notes.

## React Requirements Covered

This project intentionally covers the expected React concepts from the course brief.

### Core Concepts

- Functional components
- Props and composition
- State management with `useState`
- Side effects with `useEffect`
- Conditional rendering
- Lists and keys

### Intermediate Concepts

- Lifting state up through page-level state and shared contexts
- Controlled components for inputs and textareas
- Routing with React Router
- Context API for committee and authentication state

### Advanced Concepts

- `useMemo` for derived state and performance-sensitive calculations
- `useCallback` for stable event handlers
- `useRef` for persistent DOM and mutable references
- Framer Motion for subtle transitions and page entry animations
- Performance-aware memoization on alliance country cards

## Architecture

Loominaries uses a layered frontend architecture:

### 1. App Shell Layer

- Global layout and navigation live in the shell.
- The sidebar and header stay consistent across all protected pages.
- Routes animate gently as the user changes sections.

### 2. State Layer

- `AuthContext` handles authentication state.
- `CommitteeContext` stores committee setup and live session tracker data.
- Custom hooks isolate reusable logic for auth, committee data, debounce, and alliance analytics.

### 3. Service Layer

- `firebase.js` initializes Firebase services.
- `ai.js` handles Groq-based AI requests and speech analysis.

### 4. UI Layer

- Shared cards, progress bars, and loaders keep the interface consistent.
- Pages are built as focused workspaces rather than generic dashboards.

## Project Structure

```text
src/
  components/
    AppLayout.jsx
    GoogleSignInButton.jsx
    MissionBrief.jsx
    ProtectedRoute.jsx
    PublicOnlyRoute.jsx
    ui/
      ProgressBar.jsx
      ResourceCard.jsx
      SkeletonLoader.jsx
  context/
    AuthContext.jsx
    CommitteeContext.jsx
  hooks/
    useAuth.js
    useAllianceStats.js
    useCommittee.js
    useDebounce.js
  pages/
    Alliance.jsx
    Dashboard.jsx
    Live.jsx
    Login.jsx
    Notepad.jsx
    Research.jsx
    Signup.jsx
  services/
    ai.js
    firebase.js
  utils/
    validators.js
  App.jsx
  index.css
  main.jsx
```

## Data Model

Loominaries stores user-specific data in Firestore using a simple, practical structure.

### Collections

- `committees`
  - Stores committee name, portfolio, and agenda.
  - Used as the app-wide mission brief.

- `resources`
  - Stores research links.
  - Also stores AI-generated outputs and live speeches.

- `countries`
  - Stores alliance tracker records.
  - Includes sentiment, vote position, and creation timestamps.

- `notes`
  - Stores the auto-saving strategy notepad as a single user document.
  - Supports live updates and note continuity.

- `sessions`
  - Stores live War Room engagement data and POI history.

## Tech Stack

### Frontend

- React 19
- Vite
- React Router DOM v6
- Tailwind CSS v4
- Framer Motion
- Lucide React icons

### Backend / Services

- Firebase Authentication
- Cloud Firestore
- Groq AI API

### UX Helpers

- React Hot Toast
- Custom debouncing hook
- Memoized card components

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a root `.env` file in the project root. Use `.env.example` as the template.

### 3. Add Your Credentials

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

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

### 6. Preview the Production Build

```bash
npm run preview
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase app credential |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase application ID |
| `VITE_GROQ_API_KEY` | Groq API access key |
| `VITE_GROQ_MODEL` | Primary AI model |
| `VITE_GROQ_FALLBACK_MODEL` | Fallback AI model |

## Firebase Setup

### Authentication

- Enable Email/Password sign-in.
- Enable Google sign-in if you want OAuth login.
- Add your local and deployed domains under authorized domains.

### Firestore

Create the database and publish the project rules before testing persistence.

Recommended collections:

- `committees`
- `resources`
- `countries`
- `notes`
- `sessions`

### Firestore Rules

The repository includes a `firestore.rules` file. Publish it in Firebase Console so the app can persist user-owned data safely.

If you update the data model later, update the console rules as well.

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in page |
| `/signup` | Account creation page |
| `/dashboard` | Committee setup and overview |
| `/research` | AI research and resource library |
| `/live` | War Room live session analysis |
| `/alliance` | Alliance tracker CRM |
| `/notepad` | Auto-saving strategy notepad |

## Feature Walkthrough

### Dashboard

The dashboard collects the committee identity once and makes it available everywhere else.

What it does:

- Captures committee name, portfolio, and agenda.
- Persists the data in Firestore.
- Displays a mission brief card after setup.

### Research & AI Intelligence Hub

This is the strategy lab of the app.

Use it to:

- Ask strategic questions in context.
- Generate opening speeches.
- Generate POIs.
- Generate position ideas.
- Store reference links.
- Save AI outputs into the library for later reuse.

### War Room

This page is meant for live debate.

Workflow:

1. Enter the speaker country.
2. Paste the speech transcript.
3. Run analysis.
4. Review POIs and POOs.
5. Select a POI and save it where needed.
6. Log country engagement history.

### Alliance Tracker

This page acts as a diplomatic CRM.

Useful for:

- Tracking who is friendly.
- Tracking who is opposing.
- Monitoring voting behavior.
- Estimating what it takes to reach majority.

### Strategy Notepad

This is the personal writing workspace.

It is built for:

- Speech drafts
- Clause ideas
- Rebuttal notes
- Fast live-debate thinking

It autosaves, so users do not lose work while switching between sections.

## UI and UX Decisions

The visual direction intentionally follows a premium dashboard language:

- Black and charcoal surfaces.
- Clear hierarchy with strong headings.
- Rounded 2xl cards and controlled spacing.
- Subtle hover lift instead of flashy motion.
- Consistent button and input styling.
- Empty states that explain what to do next.
- Loading skeletons instead of plain loading text.
- Toast feedback for user actions.

The goal is clarity first. The design should feel like a serious professional tool, not an overdesigned demo.

## Performance Notes

The app includes a few targeted optimizations:

- `useMemo` for derived state such as committee readiness and alliance stats.
- `useCallback` for stable handlers across interactive pages.
- `useRef` for DOM access and live content tracking.
- Memoized country cards to reduce unnecessary rerenders.
- Debounced autosave for the notepad.
- Lightweight motion transitions only where they improve clarity.

## Submission Checklist

This project is aligned with the course submission expectations:

- Authentication system: done.
- Dashboard / main screen: done.
- Core problem-solving features: research, live analysis, alliance tracking, notepad.
- CRUD functionality: done through Firestore-backed resources, countries, notes, and committees.
- Persistent storage: done with Firebase Firestore.
- Routing: done with React Router.
- State management: done through Context API and custom hooks.
- Responsive UI: done.
- README documentation: this file.

## Viva Prep Notes

Be ready to explain:

### Problem and Solution

- Who the user is: MUN delegates.
- What the problem is: fragmented workflow tools.
- Why it matters: live debate and preparation require speed and context.

### Architecture

- Why Firebase was used.
- Why context is used for shared app state.
- Why custom hooks were extracted.
- Why AI calls are isolated in a service layer.

### React Concepts

- Controlled inputs.
- Conditional rendering.
- Context-based global state.
- Side effects with Firestore snapshots.
- Memoization and performance.

### Data Handling

- What is stored in each Firestore collection.
- How save and load flows work.
- How autosave avoids redundant writes.

### UI Decisions

- Why the interface uses dark charcoal surfaces.
- Why cards and spacing are consistent.
- Why the app favors clarity over visual noise.

## Known Notes

- Firestore rules must be published in Firebase Console for persistence to work correctly.
- The app expects valid Firebase and Groq environment variables in the root `.env` file.
- The repository currently builds successfully with `npm run build`.

## Screenshots

Add final screenshots or a short demo GIF here before submission.

## License

This project is submitted for academic evaluation as an end-term course project.
