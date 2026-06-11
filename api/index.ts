import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import { initDb } from "../server/db";
import { seedDatabase } from "../server/seed";
import { registerRoutes } from "../server/routes";

const app = express();
app.set("trust proxy", 1);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

registerRoutes(app);

app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  console.error("[error]", status, message);
  res.status(status).json({ error: message });
});

let dbReady = false;
async function ensureDb() {
  if (dbReady) return;
  dbReady = true;
  if (!process.env.DATABASE_URL) {
    console.error("[FATAL] DATABASE_URL is not set");
    return;
  }
  try {
    await initDb();
    await seedDatabase();
    console.log("[startup] DB ready");
  } catch (e: any) {
    console.error("[startup] DB error:", e.message);
  }
}

export default async function handler(req: any, res: any) {
  await ensureDb();
  return app(req, res);
}
