import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/lib/trpc/client";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mlbedgepro.dev";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "MLB Edge Pro — AI-Powered MLB Analysis",
  description:
    "Data-driven MLB game predictions, prop analysis, and edge reports. Make smarter picks every day.",
  openGraph: {
    title: "MLB Edge Pro",
    description: "Data-driven MLB analysis. Props, edges, and win predictions.",
    url: baseUrl,
    siteName: "MLB Edge Pro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MLB Edge Pro",
    description: "Data-driven MLB analysis. Props, edges, and win predictions.",
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
      signInFallbackRedirectUrl="/games"
      signUpFallbackRedirectUrl="/games"
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
          <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap" rel="stylesheet" />
          <link href="https://fonts.cdnfonts.com/css/integral-cf" rel="stylesheet" />
          {/* Spotlight design system — Archivo (headings/labels) + JetBrains Mono (numbers) */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
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
