/** Public base URL without a trailing slash (APP_URL in production). */
export function siteUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
