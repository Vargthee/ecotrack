import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use in-memory session store (no DB dependency)
app.use(session({
  secret: process.env.SESSION_SECRET || "ecotrack-dev-secret-change-in-prod",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

registerRoutes(app);

const isDev = process.env.NODE_ENV !== "production";

async function startServer() {
  if (isDev) {
    const { setupVite } = await import("./vite");
    await setupVite(app);
  } else {
    const distPath = path.resolve(__dirname, "../dist/public");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  const portArgIdx = process.argv.indexOf("--port");
  const port = portArgIdx !== -1 ? Number(process.argv[portArgIdx + 1]) : (Number(process.env.PORT) || 5000);
  app.listen(port, "0.0.0.0", () => {
    console.log(`[ecotrack] Server running on port ${port} (${isDev ? "development" : "production"})`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});