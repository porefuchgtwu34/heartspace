import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "HeartSpace — Love, Relationships & the Psychology of Us",
  description:
    "A warm community for love, relationships, behaviour and psychology. Share, journal, take quizzes, find your people — anonymously, by username.",
  keywords: ["love", "relationships", "psychology", "dating", "mood journal", "community", "self-love"],
  authors: [{ name: "HeartSpace" }],
  openGraph: {
    title: "HeartSpace — Love, Relationships & Psychology",
    description: "Share your heart. Find your people. Grow together.",
    siteName: "HeartSpace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HeartSpace",
    description: "A warm community for love, relationships & psychology.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Providers>
            {children}
            <Toaster />
            <SonnerToaster position="top-center" richColors />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
