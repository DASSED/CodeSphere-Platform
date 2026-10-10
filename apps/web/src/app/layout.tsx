import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

// Google Fonts only (CADEV rule), self-hosted at build time by next/font.
const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-outfit", display: "swap" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeSphere Platform",
  description: "Plateforme d'échange pour développeurs africains",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${outfit.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
