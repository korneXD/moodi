import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AUTHOR, SITE_DESCRIPTION, SITE_NAME, SITE_OG_DESCRIPTION, SITE_TITLE, SITE_URL, TWITTER_HANDLE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// A new file name whenever the picture changes: X, Facebook, LinkedIn and Slack cache a link preview by its image URL.
// Regenerate it by screenshotting /og at 1200×630.
const OG_IMAGE = {
  url: "/opengraph-v1.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "moodi: a smiling purple 3D ghost next to the words Tiny 3D mood buddies for your UI and npm i moodi",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "moodi",
    "3D mascot",
    "3D avatar",
    "web component",
    "React component",
    "three.js",
    "loading animation",
    "AI status indicator",
    "UI character",
  ],
  category: "technology",
  authors: [{ name: TWITTER_HANDLE, url: AUTHOR.url }],
  creator: TWITTER_HANDLE,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: { title: SITE_TITLE, description: SITE_OG_DESCRIPTION, url: "/", siteName: SITE_NAME, type: "website", locale: "en_US", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_OG_DESCRIPTION, site: TWITTER_HANDLE, creator: TWITTER_HANDLE, images: [OG_IMAGE] },
};

export const viewport: Viewport = { themeColor: "#0c0b0a" };

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
