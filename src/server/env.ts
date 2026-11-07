import "server-only";
import { z } from "zod";

// `KEY=` with nothing after it (as in a copied .env.example) means "not set"
const optional = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());

const schema = z.object({
  DATABASE_URL: z.url(),
  CLERK_SECRET_KEY: z.string().min(1),
  // only the Clerk webhook needs it; locally, users are synced on first sign-in instead
  CLERK_WEBHOOK_SIGNING_SECRET: optional,
});

let cached: z.infer<typeof schema> | undefined;

// Parsed on first use rather than at import, so `next build` works without secrets.
export function env() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid or missing environment variables: ${missing}`);
    }
    cached = parsed.data;
  }
  return cached;
}
