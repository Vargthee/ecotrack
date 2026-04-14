import express from "express";
import compression from "compression";
import session from "express-session";
import pg from "pg";
import ConnectPgSimple from "connect-pg-simple";
import { initDb } from "../server/db";
import { seedDatabase } from "../server/seed";
import { registerRoutes } from "../server/routes";

const app = express();

// Required so Express reads the real client IP and protocol from Vercel's
// reverse-proxy headers — necessary for secure cookies and rate limiting.
app.set("trust proxy", 1);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PgSession = ConnectPgSimple(session);

// Always use SSL for the session pool — needed for Neon and most hosted Postgres.
const sessionPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      createTableIfMissing: true,
      tableName: "session",
      pruneSessionInterval: 60 * 15,
    }),
    secret: process.env.SESSION_SECRET || "ecotrack-dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,      // Vercel always serves over HTTPS
      httpOnly: true,
      sameSite: "lax",   // prevents CSRF while allowing normal same-site navigation
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

registerRoutes(app);

const ready = initDb().then(() =>
  seedDatabase().catch((e) => console.error("[seed]", e))
);

export default async function handler(req: any, res: any) {
  await ready;
  return app(req, res);
}
