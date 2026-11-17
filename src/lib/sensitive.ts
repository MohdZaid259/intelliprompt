/**
 * Spots things people commonly paste into prompts that shouldn't go public. A best-effort
 * warning before publishing, not a guarantee: it errs toward flagging.
 */
const CHECKS: { label: string; pattern: RegExp; valid?: (match: string) => boolean }[] = [
  {
    label: "an API key or token",
    pattern:
      /\b(?:sk-[A-Za-z0-9_-]{16,}|sk_(?:live|test)_[A-Za-z0-9]{16,}|rzp_(?:live|test)_[A-Za-z0-9]{10,}|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[abpr]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/,
  },
  {
    label: "a password",
    pattern: /\b(?:password|passwd|pwd)\s*[:=]\s*\S{4,}/i,
  },
  {
    label: "an email address",
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  },
  {
    label: "a card number",
    pattern: /\b(?:\d[ -]?){13,19}\b/,
    valid: (m) => luhn(m.replace(/\D/g, "")),
  },
  {
    label: "a phone number",
    // 10-13 digits, optionally with + and spaces, dashes or brackets (covers +91 98765 43210)
    pattern: /(?:\+|\b)\d(?:[\s()-]?\d){9,12}\b/,
    valid: (m) => !luhn(m.replace(/\D/g, "")) || m.replace(/\D/g, "").length < 13,
  },
];

function luhn(digits: string) {
  if (digits.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return sum % 10 === 0;
}

/** Labels for the kinds of private data found, e.g. ["an email address"]. */
export function findSensitive(text: string): string[] {
  const found: string[] = [];
  for (const { label, pattern, valid } of CHECKS) {
    const global = new RegExp(
      pattern.source,
      pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g",
    );
    const hit = [...text.matchAll(global)].some((m) => !valid || valid(m[0]));
    if (hit) found.push(label);
  }
  // a card number also looks like a phone number; report it once
  if (found.includes("a card number")) return found.filter((f) => f !== "a phone number");
  return found;
}
