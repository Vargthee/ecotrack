import express from "express";
import compression from "compression";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import pg from "pg";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { isCloudStorageConfigured } from "./cloudStorage";

const uploadsDir = path.resolve(process.cwd(), "uploads");

if (!isCloudStorageConfigured() && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

app.set("trust proxy", 1);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!isCloudStorageConfigured()) {
  app.use("/uploads", express.static(uploadsDir));
}

const isProd = process.env.NODE_ENV === "production";

// ─── SESSION STORE ─────────────────────────────────────────────────────────
// Always use PostgreSQL-backed sessions so they survive serverless cold-starts,
// multiple instances, and deployments (Vercel, Replit, etc.).
// connect-pg-simple needs a standard pg.Pool — this works with Neon via TCP too.
function buildSessionStore() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[session] No DATABASE_URL — falling back to in-memory sessions (dev only)");
    return undefined;
  }

  const PgStore = ConnectPgSimple(session);
  const pool = new pg.Pool({
    connectionString,
    ssl: isProd ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  return new PgStore({
    pool,
    createTableIfMissing: true,
    tableName: "session",
    pruneSessionInterval: 60 * 15,
  });
}

app.use(
  session({
    store: buildSessionStore(),
    secret: process.env.SESSION_SECRET || "ecotrack-dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

registerRoutes(app);

// ── JSON error handler (must be after routes) ────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  console.error("[error]", status, message);
  res.status(status).json({ error: message });
});

export { app };
