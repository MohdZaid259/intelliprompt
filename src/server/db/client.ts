import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import type { Db } from "./types";

// Plain factory (no server-only guard) so the email worker can use it outside Next.js.
export function createDb(url: string): Db {
  // prepare: false keeps it compatible with transaction-mode poolers (Neon/Supabase)
  return drizzle(postgres(url, { prepare: false }), { schema });
}
