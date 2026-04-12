import express from "express";
import compression from "compression";
import session from "express-session";
import { initDb } from "../server/db";
import { seedDatabase } from "../server/seed";

const app = express();

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
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

// Dynamically import and register routes to avoid top-level side effects
let routesRegistered = false;
const ready = initDb().then(() =>
  seedDatabase().catch((e) => console.error("[seed]", e))
);

export default async function handler(req: any, res: any) {
  await ready;

  if (!routesRegistered) {
    const { registerRoutes } = await import("../server/routes");
    registerRoutes(app);
    routesRegistered = true;
  }

  return app(req, res);
}
