# EcoTrack — Plateau State Waste Management Platform

Full-stack TypeScript smart waste management system for Jos, Plateau State, Nigeria. Connects residents (users), collection drivers, and administrators.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Express.js (TypeScript, port 5000)
- **Database**: PostgreSQL via Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6 with role-based guards
- **State/Data**: TanStack Query (React Query)
- **Maps**: React Leaflet
- **Charts**: Recharts

## Demo Credentials

| Role   | Email                   | Password   | Notes                   |
|--------|-------------------------|------------|-------------------------|
| Admin  | admin@ecotrack.com      | admin123   | Full system access       |
| Driver | driver@ecotrack.com     | driver123  | KYC approved            |
| User   | user@ecotrack.com       | user123    | Pro subscription         |

Additional seeded drivers: ibrahim.musa@ecotrack.com (KYC pending), solomon.danjuma@ecotrack.com (KYC rejected)
Additional seeded users: halima.sule, emeka.nwosu, fatima.abdullahi, daniel.lalong — all @ecotrack.com / user123

## Project Structure

```
src/
  App.tsx            - Root app with role-based routing + guards
  pages/             - Route-level page components
    UserDashboard.tsx   - Resident portal (pickups, eco points, map)
    DriverPage.tsx      - Driver portal (tasks, earnings)
    DriverKYCPage.tsx   - Real KYC form wizard (API-connected)
    AdminPage.tsx       - Admin dashboard (6 management tabs incl. KYC)
    AnalyticsPage.tsx   - Role-aware analytics
  components/        - Reusable UI components
    AppSidebar.tsx      - Role-aware navigation
    FeatureGate.tsx     - Subscription gating (admin bypass)
  contexts/          - Auth + Subscription context providers
  data/              - Mock/static data (mockData.ts, adminMockData.ts)

server/
  index.ts           - Express server + seed-on-startup
  routes.ts          - All API endpoints
  storage.ts         - PostgreSQL storage layer (IStorage interface)
  db.ts              - Drizzle DB connection
  seed.ts            - Demo data seeder (no-op if data exists)

shared/
  schema.ts          - Drizzle schema (single source of truth)
```

## Database Schema

Tables: `users`, `waste_bins`, `driver_tasks`, `citizen_reports`, `pickup_requests`, `eco_points_log`, `subscriptions`, `driver_kyc`

Key enums: `user_role`, `kyc_status`, `pickup_status`, `plan_tier`, `waste_type`, `report_status`

## KYC System

Drivers complete a 4-step verification wizard (Govt ID → Driver's License → Vehicle Details → Profile Photo). Submissions are stored in the `driver_kyc` table. Admins review and approve/reject from the KYC tab in the Admin Dashboard with optional rejection reason. The KYC page reads existing status from the API on load and shows re-submission UI for rejected drivers.

## Key API Endpoints

- `POST /api/auth/login` — login (returns role)
- `GET /api/bins` — waste bins
- `GET /api/tasks` — driver tasks (filtered by role)
- `GET /api/pickups` — pickup requests (filtered by role)
- `GET /api/eco-points` — balance + log
- `GET/POST /api/driver/kyc` — driver KYC status/submission
- `GET /api/admin/kyc` — all KYC (admin only)
- `PATCH /api/admin/kyc/:driverId` — approve/reject KYC (admin only)
- `GET /api/admin/stats` — system-wide stats

## Running

```bash
npm run dev        # Start dev server (seeds DB on first run)
npm run db:push    # Sync schema changes to database
npm run build      # Build for production
```

## Configuration Notes

- Dev server on port 5000 (Vite proxied through Express)
- `allowedHosts: true` in vite.config.ts for Replit iframe
- Google Fonts loaded non-blocking via `<link media="print" onload>` in index.html
- Leaflet CSS imported once globally in `src/index.css`
- Manual Vite chunk splitting: react-vendor, map-vendor, charts-vendor, ui-vendor
- Session auth via `express-session` (in-memory store)
- Subscription context mirrors DB plan via localStorage key `ecotrack_subscription`
