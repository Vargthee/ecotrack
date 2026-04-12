import { app } from "../server/app";
import { initDb } from "../server/db";
import { seedDatabase } from "../server/seed";

const ready = initDb().then(() =>
  seedDatabase().catch((e) => console.error("[seed]", e))
);

export default async function handler(req: any, res: any) {
  await ready;
  return app(req, res);
}
