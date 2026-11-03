import "server-only";
import { env } from "@/server/env";
import { createDb } from "./client";
import type { Db } from "./types";

export type { Db };

// Reuse one client across hot reloads in dev.
const globalForDb = globalThis as unknown as { db?: Db };

export function db(): Db {
  globalForDb.db ??= createDb(env().DATABASE_URL);
  return globalForDb.db;
}
