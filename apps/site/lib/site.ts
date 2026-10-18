export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.getmoodi.dev").replace(/\/$/, "");
export const SITE_NAME = "moodi";
/** 50–60 characters: fills the search result line without getting cut. */
export const SITE_TITLE = "moodi – 3D Mood Buddy for React and Web Components";
/** The meta description (search results): 150 characters at most. */
export const SITE_DESCRIPTION =
  "moodi is a tiny 3D character for your website. One line of code, and its face shows what is happening: thinking, loading, happy, error.";
/** The og:description and twitter:description (link previews): 120 characters at most. */
export const SITE_OG_DESCRIPTION = "A soft 3D mood buddy for your UI. Drop it in with one line, React or Web Component. Free and open source.";

export const GITHUB_URL = "https://github.com/korneXD/moodi";
export const FEEDBACK_URL = "https://insigh.to/b/moodi";
export const NPM_URL = "https://www.npmjs.com/package/moodi";
export const TWITTER_HANDLE = "@indiekornel";
export const AUTHOR = { handle: "indiekornel", name: "Kornel", url: "https://x.com/indiekornel", avatar: "/creator-v3.jpg" };

/** Safe to drop into a <script type="application/ld+json"> tag. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
