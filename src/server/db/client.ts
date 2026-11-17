import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import type { Db } from "./types";

// Plain factory (no server-only guard) so the email worker can use it outside Next.js.
export function createDb(url: string): Db {
  return drizzle(
    postgres(url, {
      // compatible with transaction-mode poolers (Neon/Supabase)
      prepare: false,
      // Serverless instances get frozen between requests, and a socket left open across a freeze can
      // be dead on wake. Without these, the next query waited on it for minutes (seen in production).
      connect_timeout: 10, // seconds to open a connection before failing
      idle_timeout: 20, // close connections idle this long, so few survive a freeze
      max_lifetime: 60 * 5, // recycle every connection after 5 minutes
      keep_alive: 10, // TCP keepalive, so a dead peer is noticed in seconds
    }),
    { schema },
  );
}
