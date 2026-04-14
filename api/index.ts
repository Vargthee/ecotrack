import express from "express";
import compression from "compression";
import session from "express-session";
import { Pool } from "pg";
import connectPgSimple from "connect-pg-simple";
import { initDb } from "../server/db";
import { seedDatabase } from "../server/seed";
import { registerRoutes } from "../server/routes";

const DATABASE_URL = process.env.DATABASE_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || "ecotrack-dev-secret-change-in-prod";

if (!DATABASE_URL) {
  console.error("[FATAL] DATABASE_URL is not set — add it to Vercel Environment Variables.");
}

// Build the Express app synchronously so it is ready before any request hits.
// All middleware (including session) must be registered before registerRoutes().
const app = express();
app.set("trust proxy", 1);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session store (pg pool — works with Neon via TCP + SSL) ──────────────────
let store: session.Store | undefined;
if (DATABASE_URL) {
  try {
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    pool.on("error", (err) => console.error("[session-pool]", err.message));
    const PgStore = connectPgSimple(session);
    store = new PgStore({
      pool,
      createTableIfMissing: true,
      tableName: "session",
      pruneSessionInterval: false,
      errorLog: (msg: string) => console.error("[session-store]", msg),
    });
    console.log("[session] PostgreSQL session store initialised");
  } catch (err: any) {
    console.error("[session] Failed to create session store:", err.message);
  }
}

app.use(
  session({
    store,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

registerRoutes(app);

app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  console.error("[error]", status, message);
  res.status(status).json({ error: message });
});

// ── One-time DB init (runs on cold start, safe to await in handler) ───────────
let dbReady = false;
async function ensureDb() {
  if (dbReady) return;
  dbReady = true;
  if (!DATABASE_URL) return;
  try {
    await initDb();
    await seedDatabase();
    console.log("[startup] DB ready");
  } catch (e: any) {
    console.error("[startup]", e.message);
  }
}

export default async function handler(req: any, res: any) {
  await ensureDb();
  return app(req, res);
}
