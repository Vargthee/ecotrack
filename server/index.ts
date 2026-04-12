import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { app } from "./app";
import { initDb } from "./db";
import { seedDatabase } from "./seed";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";

async function startServer() {
  await initDb();
  await seedDatabase().catch((e) => console.error("[seed] Error:", e));

  if (isDev) {
    const { setupVite } = await import("./vite");
    await setupVite(app);
  } else {
    const distPath = path.resolve(__dirname, "../dist/public");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  const portArgIdx = process.argv.indexOf("--port");
  const port = portArgIdx !== -1
    ? Number(process.argv[portArgIdx + 1])
    : (Number(process.env.PORT) || 5000);

  app.listen(port, "0.0.0.0", () => {
    console.log(`[ecotrack] Server running on port ${port} (${isDev ? "development" : "production"})`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
