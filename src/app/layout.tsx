import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
    default: "Prever - Prediction Market Brasileiro",
    template: "%s | Prever",
  },
  description:
    "Aposte em eventos de política, economia e esportes. Sem crypto, sem complicação. Igual Betano, mas para previsões.",
  keywords: [
    "prediction market",
    "apostas",
    "brasil",
    "política",
    "economia",
    "previsões",
  ],
  authors: [{ name: "Prever" }],
  creator: "Prever",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://prever.com.br",
    siteName: "Prever",
    title: "Prever - Prediction Market Brasileiro",
    description: "Aposte em eventos de política, economia e esportes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prever - Prediction Market Brasileiro",
    description: "Aposte em eventos de política, economia e esportes.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background flex flex-col`}
      >
        <Header />
        <main className="container py-8 flex-1">{children}</main>
        <Footer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
