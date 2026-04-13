# EcoTrack — Smart Waste Management Platform
### Plateau State (Jos), Nigeria

---

## What Is EcoTrack?

EcoTrack is a full-stack web platform that modernises waste management for Plateau State. It connects three groups in one system:

- **Residents** — request waste pickups, report dumping incidents, earn eco-points for responsible disposal
- **Drivers** — receive collection tasks, manage KYC verification, track earnings
- **City Administrators** — monitor bins across the city in real time, manage drivers, view analytics, and respond to citizen reports

The platform replaces ad-hoc, paper-based waste coordination with a live digital system accessible from any browser — no app download required.

---

## The Problem It Solves

| Problem | EcoTrack Solution |
|---|---|
| Residents have no way to request or track waste pickup | Self-service pickup request with live status updates |
| Bins overflow before drivers know about them | Real-time bin fill-level monitoring with colour-coded alerts |
| Illegal dumping goes unreported or ignored | Geo-tagged citizen reporting with photo evidence and admin response |
| No accountability for drivers | KYC verification with document upload, vehicle registration, and admin approval |
| Zero incentive for residents to recycle | Eco-points gamification — points earned per pickup, redeemable for rewards |
| Administrators operate blind with no data | Live dashboard with analytics: pickups completed, bins monitored, reports resolved |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Development server and build tool |
| **TypeScript** | Type safety across the entire codebase |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Pre-built accessible component library (buttons, modals, cards, etc.) |
| **Radix UI** | Headless primitives under shadcn (dropdowns, dialogs, popovers) |
| **React Router v6** | Client-side routing with role-based route guards |
| **TanStack Query (React Query)** | Server state management, caching, and background data sync |
| **React Hook Form + Zod** | Form handling and schema validation |
| **Recharts** | Analytics and data visualisation charts |
| **React Leaflet + Leaflet.js** | Interactive bin map with live marker overlays |
| **Lucide React** | Icon library |
| **Sonner** | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express.js v5** | HTTP server and API routing |
| **TypeScript** | Full type safety on the server |
| **express-session** | Session-based authentication |
| **connect-pg-simple** | PostgreSQL-backed persistent session store |
| **bcryptjs** | Password hashing |
| **multer** | File upload handling (KYC documents) |
| **compression** | HTTP response compression |
| **Server-Sent Events (SSE)** | Real-time push notifications to the browser without WebSockets |

### Database
| Technology | Purpose |
|---|---|
| **PostgreSQL 16** | Primary relational database |
| **Drizzle ORM** | Type-safe SQL query builder and schema manager |
| **Drizzle Zod** | Auto-generated Zod schemas from database tables |

### Deployment
| Technology | Purpose |
|---|---|
| **Vercel** | Serverless deployment for both the frontend and API |
| **Cloudflare R2** | Object storage for KYC document uploads (production) |
| **Neon / Supabase** | Managed cloud PostgreSQL (production database) |

---

## Architecture Overview

```
Browser (React SPA)
       │
       ├── Static assets served by Vercel CDN
       │
       └── API calls (/api/*) → Vercel Serverless Function
                                        │
                              Express.js (api/index.ts)
                                        │
                              ┌─────────┴─────────┐
                         Drizzle ORM         Session Store
                              │                    │
                         PostgreSQL          PostgreSQL
                         (data)              (sessions)
```

In development, Express and Vite run together on port 5000. In production, Vite builds the frontend into static files served by Vercel's CDN, and all `/api/*` routes are handled by a single Express serverless function.

### Real-Time Events

A lightweight event bus (`EventEmitter`) sits inside the Express server. When key actions happen (pickup created, KYC approved, bin updated, etc.), the server emits an event. The browser holds an open SSE connection to `/api/events` and receives those events instantly — no polling required. The browser then updates its UI state and shows a notification in the bell panel.

---

## Database Schema

The database has **8 tables**:

| Table | Description |
|---|---|
| `users` | All accounts — residents, drivers, and admins. Role stored as enum. |
| `waste_bins` | Physical bin locations with GPS coordinates and live fill levels |
| `driver_tasks` | Collection jobs assigned to drivers — bin, priority, estimated time, earning |
| `citizen_reports` | Illegal dumping and overflowing bin reports from residents, with photo URL and GPS |
| `pickup_requests` | Resident-initiated pickup jobs with waste type, status, and assigned driver |
| `eco_points_log` | Ledger of all eco-point events per user (action + points + timestamp) |
| `driver_kyc` | Driver verification records — government ID, licence, vehicle details, approval status |
| `subscriptions` | Resident subscription tier (Basic / Pro / Enterprise) with billing cycle |

All relationships are enforced with foreign keys. Enums are used for all status/type fields.

---

## Key Features by Role

### Resident (User)
- Register and log in securely
- Request a waste pickup (general, recycling, organic, e-waste)
- Track pickup status in real time (pending → assigned → in progress → completed)
- Submit geo-tagged reports with photos for illegal dumping or overflowing bins
- View eco-points balance, history, and leaderboard position
- Manage subscription plan (Basic / Pro / Enterprise)
- Receive instant in-app notifications for pickup updates

### Driver
- Register and submit KYC (government ID, driver's licence, vehicle info)
- View assigned collection tasks sorted by priority
- Mark tasks complete and track daily/weekly earnings
- Receive instant notifications for new task assignments

### Administrator
- Full platform dashboard with live stats (pickups, bins, reports, drivers, eco-points)
- Live bin monitoring map with colour-coded fill levels
- Review and approve/reject driver KYC applications
- Manage pickup requests (assign drivers, update status)
- Review and respond to citizen reports
- View analytics: collection trends, report frequency, driver performance
- Receive alerts when bins reach high fill levels

---

## Role-Based Access Control

Routes and UI are protected at both the backend (session + role check on every API request) and the frontend (route guards that redirect unauthorised users):

| Route | Who Can Access |
|---|---|
| `/` | Public (landing page) |
| `/auth` | Public (login/register) |
| `/user-dashboard` | Residents only |
| `/pickups`, `/eco-points`, `/reports` | Residents only |
| `/driver` | Drivers only |
| `/driver/kyc` | Drivers only |
| `/admin` | Admins only |
| `/map`, `/analytics`, `/pricing`, `/billing` | Authenticated users |

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Administrator | admin@ecotrack.com | admin123 |
| Driver | driver@ecotrack.com | driver123 |
| Resident | user@ecotrack.com | user123 |

---

## Project File Structure

```
/
├── src/                        # React frontend
│   ├── pages/                  # One file per page/view
│   │   ├── LandingPage.tsx     # Public marketing page
│   │   ├── AuthPage.tsx        # Login & registration
│   │   ├── UserDashboard.tsx   # Resident home
│   │   ├── DriverPage.tsx      # Driver task management
│   │   ├── AdminPage.tsx       # Admin control panel
│   │   ├── EcoPointsPage.tsx   # Points & leaderboard
│   │   ├── ReportsPage.tsx     # Citizen reports
│   │   ├── MapPage.tsx         # Live bin map
│   │   ├── AnalyticsPage.tsx   # Charts & trends
│   │   ├── PricingPage.tsx     # Subscription plans
│   │   └── BillingPage.tsx     # Subscription management
│   ├── components/             # Shared UI components
│   │   ├── AppLayout.tsx       # Authenticated shell (sidebar + header)
│   │   ├── AppSidebar.tsx      # Navigation sidebar
│   │   ├── NotificationBell.tsx# Real-time notification dropdown
│   │   ├── ThemeToggle.tsx     # Light/dark mode toggle
│   │   ├── BinMapView.tsx      # Leaflet map component
│   │   └── ui/                 # shadcn/ui components
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Global auth state
│   │   └── NotificationsContext.tsx # In-session notification store
│   └── hooks/
│       └── useRealtimeEvents.ts # SSE consumer + query invalidation
│
├── server/                     # Express backend
│   ├── routes.ts               # All API endpoints
│   ├── db.ts                   # Database connection (Drizzle)
│   ├── storage.ts              # Data access layer
│   ├── seed.ts                 # Demo data seeder
│   ├── eventBus.ts             # In-memory event emitter
│   ├── cloudStorage.ts         # Cloudflare R2 integration
│   └── vite.ts                 # Vite dev middleware
│
├── shared/
│   └── schema.ts               # Database schema + TypeScript types (shared between server and client)
│
├── api/
│   └── index.ts                # Vercel serverless entry point
│
├── vercel.json                 # Vercel deployment configuration
└── index.html                  # HTML shell with theme init script
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get current session user |
| GET | `/api/bins` | List all waste bins |
| PATCH | `/api/bins/:id/fill` | Update bin fill level |
| GET | `/api/pickups` | Get pickups (role-filtered) |
| POST | `/api/pickups` | Create pickup request |
| PATCH | `/api/pickups/:id/status` | Update pickup status |
| GET | `/api/tasks` | Get driver tasks |
| POST | `/api/tasks` | Create driver task |
| PATCH | `/api/tasks/:id/complete` | Mark task complete |
| GET | `/api/reports` | Get citizen reports |
| POST | `/api/reports` | Submit new report |
| GET | `/api/eco-points` | Get user's points & history |
| GET | `/api/driver/kyc` | Get driver KYC status |
| POST | `/api/driver/kyc` | Submit KYC documents |
| GET | `/api/admin/kyc` | List all KYC submissions |
| PATCH | `/api/admin/kyc/:id` | Approve or reject KYC |
| GET | `/api/admin/stats` | Platform-wide stats |
| GET | `/api/subscriptions/me` | Get user subscription |
| GET | `/api/events` | SSE stream for real-time updates |

---

## Deployment Checklist (Vercel)

1. Push code to a GitHub repository
2. Import the repository at [vercel.com](https://vercel.com)
3. Set two environment variables in Vercel project settings:
   - `DATABASE_URL` — connection string from a cloud PostgreSQL provider (Neon recommended — free tier available)
   - `SESSION_SECRET` — any random string of 32+ characters
4. Deploy — Vercel auto-detects the build command from `vercel.json`
5. On first request, sessions table is created automatically and demo data is seeded

---

## What Makes It Production-Ready

- **No mock data** — all data flows through a real PostgreSQL database with enforced schema
- **Session persistence** — sessions stored in the database, survive server restarts and serverless cold starts
- **Type safety end-to-end** — the same TypeScript types from `shared/schema.ts` are used on both the server and the React client
- **Role enforcement on every request** — the server checks session role on every protected API route, not just the frontend
- **Cloud storage ready** — KYC document uploads switch automatically from local disk (development) to Cloudflare R2 (production) when credentials are present
- **Real-time updates** — live bin alerts, pickup status changes, and KYC decisions delivered instantly via SSE without polling
