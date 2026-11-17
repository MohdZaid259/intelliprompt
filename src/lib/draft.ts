// Hands a prompt enhanced on the home page over to the editor after sign-up.
// Browser storage can be unavailable (private mode, blocked); then it's simply skipped.

const KEY = "intelliprompt:draft";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function saveDraft(content: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ content, at: Date.now() }));
  } catch {}
}

/** Returns the saved draft once, then forgets it. */
export function takeDraft(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    if (!raw) return null;
    const { content, at } = JSON.parse(raw) as { content?: unknown; at?: unknown };
    if (typeof content !== "string" || typeof at !== "number") return null;
    return Date.now() - at < MAX_AGE_MS ? content : null;
  } catch {
    return null;
  }
}
