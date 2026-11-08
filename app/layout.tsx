import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/lib/trpc/client";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mlbedgepro.dev";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Edge-to-edge on notched / foldable displays — content respects env(safe-area-inset-*) in globals.css
  viewportFit: "cover",
  themeColor: "#eceef2",
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Edge Pro — Live NBA, NFL & Soccer Analysis",
  description:
    "Live game trackers, real DraftKings prop lines and model-graded picks for the NBA, NFL and soccer.",
  openGraph: {
    title: "Edge Pro",
    description: "Live NBA, NFL & soccer analysis. Real prop lines, edges, and win probabilities.",
    url: baseUrl,
    siteName: "Edge Pro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Edge Pro",
    description: "Live NBA, NFL & soccer analysis. Real prop lines, edges, and win probabilities.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/home"
      signUpFallbackRedirectUrl="/home"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Bricolage Grotesque (display accents) + Hanken Grotesk (body/UI, everywhere) + JetBrains Mono (numbers) */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@6..144,400..800&family=Hanken+Grotesk:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-sans antialiased overflow-x-hidden">
          <TRPCProvider>
            {children}
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
