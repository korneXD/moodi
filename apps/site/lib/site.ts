export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.getmoodi.dev").replace(/\/$/, "");
export const SITE_NAME = "moodi";
export const SITE_TITLE = "moodi – 3D mood buddies";
/** The meta description (search results): 150 characters at most. */
export const SITE_DESCRIPTION =
  "moodi is a tiny 3D character for your website. One line of code, and its face shows what is happening: thinking, loading, happy, error.";
/** The og:description and twitter:description (link previews): 120 characters at most. */
export const SITE_OG_DESCRIPTION = "A soft 3D mood buddy for your UI. Drop it in with one line, React or Web Component. Free and open source.";

export const GITHUB_URL = "https://github.com/korneXD/moodi";
export const NPM_URL = "https://www.npmjs.com/package/moodi";
export const TWITTER_HANDLE = "@itsk0rn3l";
export const AUTHOR = { handle: "itsk0rn3l", name: "Kornel", url: "https://x.com/itsk0rn3l", avatar: "/creator.jpg" };

/** Safe to drop into a <script type="application/ld+json"> tag. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
