import express from "express";
import compression from "compression";
import session from "express-session";
import pg from "pg";
import ConnectPgSimple from "connect-pg-simple";
import { initDb } from "../server/db";
import { seedDatabase } from "../server/seed";
import { registerRoutes } from "../server/routes";

const app = express();

// Required so Express sees the real client IP and HTTPS protocol behind Vercel's proxy.
app.set("trust proxy", 1);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("[FATAL] DATABASE_URL is not set — authentication will not work. Add it to your Vercel environment variables.");
}

const PgSession = ConnectPgSimple(session);

// Build a dedicated pg.Pool for the session store.
// Must use standard pg (not Neon WS driver) because connect-pg-simple requires it.
// Always enable SSL — needed for Neon, Supabase, Railway and most hosted Postgres.
const sessionPool = DATABASE_URL
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })
  : null;

// Log pool errors so they appear in Vercel function logs rather than crashing silently.
sessionPool?.on("error", (err) => {
  console.error("[session-pool] PostgreSQL pool error:", err.message);
});

app.use(
  session({
    store: sessionPool
      ? new PgSession({
          pool: sessionPool,
          createTableIfMissing: true,
          tableName: "session",
          pruneSessionInterval: 60 * 15,
          errorLog: (err) => console.error("[session-store]", err),
        })
      : undefined, // falls back to in-memory only if no DB (will warn in logs)
    secret: process.env.SESSION_SECRET || "ecotrack-dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,      // Vercel always serves over HTTPS
      httpOnly: true,
      sameSite: "lax",   // prevents CSRF, allows normal navigation cookies
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

registerRoutes(app);

// Initialise the DB and seed demo data once at cold-start.
const ready = (async () => {
  if (!DATABASE_URL) return;
  try {
    await initDb();
    await seedDatabase();
  } catch (e: any) {
    console.error("[startup] DB init/seed failed:", e.message);
  }
})();

export default async function handler(req: any, res: any) {
  await ready;
  return app(req, res);
}
