import type { Metadata } from "next";
import { Playground } from "@/components/playground";
import { AUTHOR, GITHUB_URL, jsonLd, NPM_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  license: "https://opensource.org/licenses/MIT",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  sameAs: [GITHUB_URL, NPM_URL],
  image: `${SITE_URL}/opengraph-v1.png`,
  creator: {
    "@type": "Person",
    name: AUTHOR.name,
    alternateName: `@${AUTHOR.handle}`,
    url: AUTHOR.url,
    image: `${SITE_URL}${AUTHOR.avatar}`,
    sameAs: [AUTHOR.url],
  },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <Playground />
    </>
  );
}
