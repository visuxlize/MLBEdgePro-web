import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes that require the user to be signed in.
 * Everything NOT in this list is public.
 */
const isProtectedRoute = createRouteMatcher([
  "/games(.*)",
  "/scores(.*)",
  "/analysis(.*)",
  "/props(.*)",
  "/hr-deep-dive(.*)",
  "/bet-tracker(.*)",
  "/settings(.*)",
  "/game(.*)",
  "/trial/checkout(.*)",   // must be signed in to start Stripe checkout
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
