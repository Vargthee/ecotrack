import express from "express";
import compression from "compression";
import session from "express-session";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";

export const uploadsDir = process.env.VERCEL
  ? "/tmp/uploads"
  : path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "ecotrack-dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

registerRoutes(app);

export { app };
