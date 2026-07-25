import type { Metadata } from "next";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"), // update to your real domain
  title: "Next Volume — English Manga Release Calendar",
  description:
    "Track upcoming English manga volume release dates across Viz, Kodansha USA, Yen Press, Seven Seas, and Square Enix Manga in one place.",
  openGraph: {
    title: "Next Volume — English Manga Release Calendar",
    description:
      "Every upcoming English manga volume release, on one shelf. Viz, Kodansha USA, Yen Press, Seven Seas, Square Enix Manga.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Next Volume — English Manga Release Calendar",
    description: "Every upcoming English manga volume release, on one shelf.",
  },
  alternates: {
    types: { "application/rss+xml": "/feed.xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
