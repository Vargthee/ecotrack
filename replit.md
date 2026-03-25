# EcoTrack Waste Management

A React + Vite frontend application for city waste management tracking and analytics.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State/Data**: TanStack Query (React Query)
- **Maps**: React Leaflet + Mapbox GL
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Project Structure

```
src/
  App.tsx          - Root app with routing and providers
  main.tsx         - Entry point
  pages/           - Route-level page components
  components/      - Reusable UI components
  contexts/        - React context providers (Auth, Subscription)
  hooks/           - Custom hooks
  lib/             - Utility functions
  data/            - Static/mock data
```

## Running the App

```bash
npm run dev        # Start dev server on port 5000
npm run build      # Build for production
npm run preview    # Preview production build
```

## Replit Configuration

- Dev server runs on port 5000 (webview)
- `host: "0.0.0.0"` and `allowedHosts: true` set in `vite.config.ts` for Replit compatibility
- `lovable-tagger` plugin removed (Lovable-specific, not needed on Replit)
