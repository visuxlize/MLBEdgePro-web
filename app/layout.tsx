import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/lib/trpc/client";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mlbedgepro.com";

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

const geist = Geist({
  variable: "--font-geist",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`${geist.variable} font-[var(--font-geist)] antialiased`}>
          <TRPCProvider>
            {children}
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
