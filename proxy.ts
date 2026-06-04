import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Public routes — accessible without signing in.
 * Everything else requires a Clerk session.
 */
const isPublicRoute = createRouteMatcher([
  "/",                            // landing page
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/trial(?!/checkout)(.*)",      // /trial and /trial?tier=... but NOT /trial/checkout
  "/upgrade(.*)",                 // pricing page — public so anyone can view plans
  "/download(.*)",
  "/results(.*)",
  "/responsible-gambling(.*)",
  "/api/stripe/webhook(.*)",      // Stripe webhooks must be unauthenticated
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
