import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// These are the actual URL paths (not the folder structure)
// The (app) group maps to: /games, /scores, /analysis, /props, etc.
const isProtectedRoute = createRouteMatcher([
  "/games(.*)",
  "/scores(.*)",
  "/analysis(.*)",
  "/props(.*)",
  "/hr-deep-dive(.*)",
  "/bet-tracker(.*)",
  "/settings(.*)",
  "/game(.*)",
  "/upgrade(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
