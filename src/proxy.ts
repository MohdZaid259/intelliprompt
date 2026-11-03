import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Optimistic gate only; every server action and data function still calls requireUser().
const isPrivateRoute = createRouteMatcher([
  "/prompts(.*)",
  "/saved(.*)",
  "/settings(.*)",
  "/billing(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPrivateRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
