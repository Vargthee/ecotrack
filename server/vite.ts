import type { Express } from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupVite(app: Express) {
  const vite = await createViteServer({
    root: path.resolve(__dirname, ".."),
    server: {
      middlewareMode: true,
      hmr: { overlay: false },
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist/public");
  app.use("/", (req: any, res: any, next: any) => {
    if (req.path.startsWith("/api")) return next();
    const filePath = path.join(distPath, req.path === "/" ? "index.html" : req.path);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    next();
  });
  app.get("*", (_req: any, res: any) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
