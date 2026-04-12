import express from "express";
import compression from "compression";
import session from "express-session";
import pg from "pg";
import ConnectPgSimple from "connect-pg-simple";
import { initDb } from "../server/db";
import { seedDatabase } from "../server/seed";
import { registerRoutes } from "../server/routes";

const app = express();

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PgSession = ConnectPgSimple(session);

const sessionPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
  max: 2,
});

app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "ecotrack-dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
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
