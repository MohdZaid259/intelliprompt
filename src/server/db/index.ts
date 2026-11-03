import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/server/env";
import * as schema from "./schema";
import type { Db } from "./types";

export type { Db };

// Reuse one client across hot reloads in dev.
const globalForDb = globalThis as unknown as { db?: Db };

export function db(): Db {
  if (!globalForDb.db) {
    // prepare: false keeps it compatible with transaction-mode poolers (Neon/Supabase)
    const client = postgres(env().DATABASE_URL, { prepare: false });
    globalForDb.db = drizzle(client, { schema });
  }
  return globalForDb.db;
}
