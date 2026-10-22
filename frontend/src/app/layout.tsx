import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import SiteShell from "@/components/SiteShell";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Josh Slumber Blis",
    template: "%s | Josh Slumber Blis",
  },
  description:
    "Shop mattresses, pillows, duvets, bedsheets and bedroom essentials from Josh Slumber Blis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-text-main">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}