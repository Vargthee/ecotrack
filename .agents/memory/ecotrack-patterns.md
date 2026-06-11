---
name: EcoTrack full-stack patterns
description: Durable lessons from building the EcoTrack platform (DB driver, auth, analytics shape, scheduling)
---

## DB driver
Uses `drizzle-orm/node-postgres` with `pg` Pool — NOT `@neondatabase/serverless`. `server/db.ts` detects Neon via DATABASE_URL containing "neon.tech" and switches to the HTTP driver only for Vercel deployments.

**Why:** Replit PostgreSQL is a standard pg-compatible database, not Neon. Neon driver fails against it.

**How to apply:** Any new DB connection code must use the node-postgres path for the dev environment.

## Auth
Session-based via `express-session` (in-memory store in dev). `req.session.userId` + `req.session.role` set on login. Frontend reads `/api/auth/me` on mount via `AuthContext`. No JWT in this project.

**Why:** Simpler than JWT for a demo; avoids token refresh complexity.

## Role-based /api/analytics
Single endpoint returns different shapes per role:
- Admin → `AdminAnalytics` (system-wide stats, trend arrays)
- Driver → `DriverAnalytics` (dailyEarnings [{day,amount,tasks}], weeklyTotal, weeklyTasks)
- User → `UserAnalytics` (pickupsByMonth, ecoPointsByMonth, wasteByType)

**How to apply:** Frontend must cast the query result to the correct role type.

## Pickup scheduling
`pickup_requests` has `scheduled_date` (date) and `time_slot` (text: "morning"/"afternoon"). POST /api/pickups accepts `scheduledDate` + `timeSlot` (optional). Driver cards show these fields when present.

## Rate limiting
DB-backed via `rate_limits` table. `checkRateLimit(key, maxRequests, windowMs)` in storage.ts. Applied to login and pickup endpoints.
