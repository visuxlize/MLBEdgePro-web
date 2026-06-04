import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/lib/trpc/client";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mlbedgepro.dev";

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
      afterSignInUrl="/games"
      afterSignUpUrl="/games"
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className="font-sans antialiased overflow-x-hidden">
          <TRPCProvider>
            {children}
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
