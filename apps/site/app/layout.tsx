import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: "moodi — Tiny 3D mood buddies for your UI",
  description:
    "A soft little 3D character you drop into any website with one line. Its face shows what's happening: thinking, loading, happy, error, sleeping.",
  openGraph: {
    title: "moodi",
    description: "Tiny 3D mood buddies for your UI.",
    url: SITE_URL,
    siteName: "moodi",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "moodi", description: "Tiny 3D mood buddies for your UI." },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0c0b0a" },
    { media: "(prefers-color-scheme: light)", color: "#f5f2ee" },
  ],
};

// runs before paint so the stored theme never flashes
const themeScript = `try{var t=localStorage.getItem('moodi-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
