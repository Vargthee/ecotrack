import * as schema from "../shared/schema";

let _db: any = null;
let _initialized = false;

export async function initDb() {
  if (_initialized) return _db;
  _initialized = true;

  const connectionString = process.env.DATABASE_URL || "";
  if (!connectionString) {
    console.log("[db] No DATABASE_URL — running without database");
    return null;
  }

  try {
    const isNeon = connectionString.includes("neon.tech") || connectionString.includes(".neon.db");

    if (isNeon) {
      const { neon } = await import("@neondatabase/serverless");
      const { drizzle } = await import("drizzle-orm/neon-http");
      const sql = neon(connectionString);
      _db = drizzle(sql, { schema });
    } else {
      const { drizzle } = await import("drizzle-orm/node-postgres");
      const pg = await import("pg");
      const Pool = pg.default?.Pool || pg.Pool;
      const pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      });
      _db = drizzle(pool, { schema });
    }

    console.log("[db] Connected to database");
  } catch (e) {
    console.error("[db] Failed to connect:", e);
  }

  return _db;
}

export function getDb() {
  return _db;
}
