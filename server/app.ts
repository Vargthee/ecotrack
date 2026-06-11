import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { isCloudStorageConfigured } from "./cloudStorage";

const uploadsDir = process.env.VERCEL
  ? "/tmp/uploads"
  : path.resolve(process.cwd(), "uploads");

if (!isCloudStorageConfigured() && !fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
}

const app = express();

app.set("trust proxy", 1);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (!isCloudStorageConfigured()) {
  app.use("/uploads", express.static(uploadsDir));
}

registerRoutes(app);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  console.error("[error]", status, message);
  res.status(status).json({ error: message });
});

export { app };
