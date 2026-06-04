import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Public routes — anyone can access these without being signed in.
 * Everything else requires authentication.
 */
const isPublicRoute = createRouteMatcher([
  "/",                           // landing page
  "/sign-in(.*)",                // Clerk sign-in
  "/sign-up(.*)",                // Clerk sign-up
  "/trial(?!/checkout)(.*)",     // /trial and /trial?tier=... but NOT /trial/checkout
  "/upgrade(.*)",                // pricing page
  "/download(.*)",
  "/results(.*)",
  "/responsible-gambling(.*)",
  "/api/stripe/webhook(.*)",     // Stripe webhooks must be unauthenticated
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
