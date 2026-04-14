import express from "express";
import compression from "compression";
import session from "express-session";
import { Pool } from "pg";
import connectPgSimple from "connect-pg-simple";
import { initDb } from "../server/db";
import { seedDatabase } from "../server/seed";
import { registerRoutes } from "../server/routes";

const app = express();
app.set("trust proxy", 1);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATABASE_URL = process.env.DATABASE_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || "ecotrack-dev-secret-change-in-prod";

if (!DATABASE_URL) {
  console.error("[FATAL] DATABASE_URL is not set on Vercel — add it to Environment Variables.");
}

// ── Session store ────────────────────────────────────────────────────────────
// Use named Pool import to avoid CJS/ESM default-export interop issues.
// Always enable SSL — required for Neon, Supabase and any hosted Postgres.
let store: session.Store | undefined;

try {
  if (DATABASE_URL) {
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    pool.on("error", (err) => console.error("[session-pool]", err.message));

    const PgStore = connectPgSimple(session);
    store = new PgStore({
      pool,
      createTableIfMissing: true,
      tableName: "session",
      pruneSessionInterval: 60 * 15,
      errorLog: (msg: string) => console.error("[session-store]", msg),
    });
    console.log("[session] PostgreSQL session store initialised");
  }
} catch (err: any) {
  console.error("[session] Failed to create session store:", err.message);
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

// ── Cold-start DB init ───────────────────────────────────────────────────────
const ready = (async () => {
  if (!DATABASE_URL) return;
  try {
    await initDb();
    await seedDatabase();
  } catch (e: any) {
    console.error("[startup]", e.message);
  }
})();

export default async function handler(req: any, res: any) {
  try {
    await ready;
    return app(req, res);
  } catch (err: any) {
    console.error("[handler]", err.message);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
}
