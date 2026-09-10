import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://wenderdotnet.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "wenderdotnet — Kelola Bot WhatsApp UMKM dari Satu Dashboard",
    template: "%s — wenderdotnet",
  },
  description:
    "Hubungkan beberapa nomor WhatsApp via QR/kode pairing, atur automasi per-device (prefix/contains/exact/regex, mentions @everyone, duration), dan pantau log. Untuk UMKM Indonesia — tanpa instalasi teknis.",
  keywords: ["bot whatsapp", "auto reply whatsapp", "whatsapp UMKM", "whatsapp multi device", "bot whatsapp Indonesia", "wenderdotnet"],
  authors: [{ name: "wenderdotnet" }],
  creator: "wenderdotnet",
  publisher: "wenderdotnet",
  category: "Business",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "wenderdotnet",
    title: "Kelola Bot WhatsApp Anda dari Satu Dashboard",
    description: "Hubungkan beberapa nomor, atur auto-reply, dan pantau semua aktivitas. Cukup scan QR, tanpa instalasi teknis.",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "wenderdotnet — Kelola bot WhatsApp Anda dari satu dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kelola Bot WhatsApp Anda dari Satu Dashboard",
    description: "Hubungkan beberapa nomor, atur auto-reply, dan pantau semua aktivitas. Cukup scan QR.",
    images: ["/opengraph.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "wenderdotnet",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Dashboard kelola bot WhatsApp multi-device: QR/kode pairing, automasi per-device, dan log aktivitas untuk UMKM Indonesia.",
    url: siteUrl,
    image: `${siteUrl}/opengraph.png`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
    featureList: ["QR pairing", "Kode pairing", "Automasi per grup", "Mentions @everyone", "Log aktivitas"],
    inLanguage: "id-ID",
  };

  return (
    <html lang="id" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-text-primary antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
