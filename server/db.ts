import * as schema from "../shared/schema";

let _db: ReturnType<typeof import("drizzle-orm/node-postgres").drizzle> | null = null;
let _initialized = false;

export function getDb() {
  if (_initialized) return _db;
  _initialized = true;

  const connectionString = process.env.DATABASE_URL || "";
  if (!connectionString) {
    console.log("[db] No DATABASE_URL — running without database");
    return null;
  }

  try {
    // Dynamic require to avoid crash when pg is not available
    const { drizzle } = require("drizzle-orm/node-postgres");
    const pg = require("pg");
    const pool = new pg.Pool({ connectionString });
    _db = drizzle(pool, { schema });
    console.log("[db] Connected to database");
  } catch (e) {
    console.error("[db] Failed to connect:", e);
  }

  return _db;
}

// Legacy export for compatibility
export const db = null;
