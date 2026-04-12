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
  app.ts             - Express app factory (middleware + routes, no listen) — shared by dev and Vercel
  index.ts           - Dev/prod server entry (imports app.ts, adds Vite, calls listen)
  routes.ts          - All API endpoints
  storage.ts         - PostgreSQL storage layer (IStorage interface)
  db.ts              - Drizzle DB connection (auto-detects Neon vs. node-postgres)
  seed.ts            - Demo data seeder (no-op if data exists)

api/
  index.ts           - Vercel serverless handler (imports app.ts, lazy-inits DB)

vercel.json          - Vercel config: frontend → CDN, /api/* → serverless function

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

## Vercel Deployment

The project is structured for zero-config Vercel deployment:

1. `vercel.json` routes `/api/*` to `api/index.ts` (Vercel serverless function) and everything else to the static Vite build
2. `server/app.ts` contains the Express app (no `listen` call) — shared between dev and Vercel
3. `api/index.ts` is the Vercel entry point; it lazy-initialises the DB before the first request
4. Uploads use `/tmp/uploads` on Vercel (ephemeral); use S3/Cloudinary in production
5. DB auto-detects Neon (HTTP driver) vs standard PostgreSQL (node-postgres + SSL)
6. **Required Vercel env vars**: `DATABASE_URL` (Neon connection string), `SESSION_SECRET`

Steps to deploy:
```bash
# 1. Create a Neon database at neon.tech
# 2. Set DATABASE_URL and SESSION_SECRET in Vercel project settings
# 3. Run schema push against the new DB:
DATABASE_URL=<neon-url> npm run db:push
# 4. Import project to Vercel — it will use vercel.json automatically
```
