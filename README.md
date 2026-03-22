# Moneyboy

Personal budget PWA for monthly cash flow management. Track income, fixed and variable expenses, visualize spending with Sankey and pie charts, and sync data across devices via Firebase.

## Features

- Dashboard with live budget calculation (income − fixed − variable)
- CRUD for income and expenses with category autosuggest
- 50/50 split cost support
- Sankey chart (income → budget → expense categories) and pie chart analysis
- Category management (rename, delete, merge)
- Firebase Firestore sync with offline localStorage fallback
- PWA — installable, works offline

## Tech Stack

| Layer | Tech |
|---|---|
| Build | Vite + TypeScript |
| UI | React, Tailwind CSS |
| Charts | Recharts |
| Backend | Firebase Auth + Firestore |
| Notifications | Firebase Cloud Messaging |
| Deployment | Coolify (Git-based, Dockerfile) |

## Design

Custom monochromatic design system ("Technical Alchemist") — JetBrains Mono, surface-token hierarchy, glassmorphism on floating elements. No third-party component library.

## Local Development

```bash
npm install
npm run dev
```

Requires a `.env.local` with:

```
VITE_FIREBASE_API_KEY=your_key
```

## Deployment

Hosted on Coolify. Every push to `main` triggers an automatic build and deploy via the project's Dockerfile — no manual steps required.