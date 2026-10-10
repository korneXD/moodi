import type { Metadata } from "next";
import { Young_Serif } from "next/font/google";
import { SITE_NAME, TWITTER_HANDLE } from "@/lib/site";
import { TestApp } from "./test-app";
import "./test.css";

const youngSerif = Young_Serif({ subsets: ["latin"], weight: "400", variable: "--font-young-serif" });

const DESCRIPTION =
  "Every moodi shape loaded three ways (React, Web Component, CDN), plus a live example: a mood picker, a chat and a waitlist form.";
const OG_IMAGE = {
  url: "/opengraph-docs-v1.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "moodi: a thinking purple 3D ghost next to a React code snippet",
};

export const metadata: Metadata = {
  title: { absolute: "moodi Test – Every Shape, Three Ways, and a Live Example" },
  description: DESCRIPTION,
  alternates: { canonical: "/test" },
  openGraph: {
    title: "moodi test",
    description: "Every shape, three ways to load, and a live example of moodi in a real UI.",
    url: "/test",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: "moodi test", site: TWITTER_HANDLE, creator: TWITTER_HANDLE, images: [OG_IMAGE] },
};

export default function TestPage() {
  return (
    <div className={`tp ${youngSerif.variable}`}>
      <TestApp />
    </div>
  );
}
