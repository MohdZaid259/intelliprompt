/**
 * Public base URL without a trailing slash: APP_URL if set, else the production domain Vercel
 * reports, else localhost in development.
 */
export function siteUrl() {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = process.env.APP_URL ?? (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}
