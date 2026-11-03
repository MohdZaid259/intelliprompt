const MIN = 3;
const MAX = 24;

// Public handle used in /u/[username]: lowercase letters, digits and underscores.
export function deriveUsername(clerkUsername: string | null, email: string) {
  const source = clerkUsername || email.split("@")[0] || "";
  const cleaned = source
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, MAX);
  return cleaned.length >= MIN ? cleaned : `user_${cleaned}`.padEnd(MIN + 5, "0");
}

export function withSuffix(username: string) {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${username.slice(0, MAX - 5)}_${suffix}`;
}
