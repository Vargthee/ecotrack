import express from "express";
import compression from "compression";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { initDb } from "../server/db";
import { seedDatabase } from "../server/seed";
import { registerRoutes } from "../server/routes";

// Neon serverless requires WebSocket for connection pooling
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || "ecotrack-dev-secret-change-in-prod";

if (!DATABASE_URL) {
  console.error("[FATAL] DATABASE_URL is not set — add it to Vercel Environment Variables.");
}

const app = express();
app.set("trust proxy", 1);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session store using Neon's serverless pool ────────────────────────────────
let store: session.Store | undefined;
if (DATABASE_URL) {
  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    const PgStore = connectPgSimple(session);
    store = new PgStore({
      pool: pool as any,
      createTableIfMissing: true,
      tableName: "session",
      pruneSessionInterval: false,
      errorLog: (msg: string) => console.error("[session-store]", msg),
    });
    console.log("[session] Neon session store initialised");
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

// ── DB init on cold start ─────────────────────────────────────────────────────
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
