import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public pages only. /lab and the /og render pages stay out.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/docs`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
