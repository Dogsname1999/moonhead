import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Tourbustix — The Ticket Stub. Evolved.",
  description: "Check in to concerts, track your setlists, listen to live recordings, share memories, and support local music. The ultimate app for live music fans.",
  metadataBase: new URL("https://www.tourbustix.com"),
  openGraph: {
    title: "Tourbustix — The Ticket Stub. Evolved.",
    description: "Check in to concerts, track your setlists, listen to live recordings, share memories, and support local music.",
    url: "https://www.tourbustix.com",
    siteName: "Tourbustix",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tourbustix — The Ticket Stub. Evolved.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tourbustix — The Ticket Stub. Evolved.",
    description: "Check in to concerts, track your setlists, listen to live recordings, share memories, and support local music.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/ticket.png",
    apple: "/ticket.png",
  },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
