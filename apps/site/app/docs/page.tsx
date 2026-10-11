import type { Metadata } from "next";
import Link from "next/link";
import { Moodi } from "moodi/react";
import { MoodList, Palettes, PropsTable, ReactPropsTable, ShapeNames } from "./parts";
import { AUTHOR, GITHUB_URL, jsonLd, SITE_NAME, SITE_URL, TWITTER_HANDLE } from "@/lib/site";

const DOCS_TITLE = "Docs";
const DOCS_DESCRIPTION =
  "Install moodi and drop a tiny 3D mood buddy into any website: React, Web Component or CDN. Props, moods, events and the API.";
const DOCS_OG_DESCRIPTION = "Install moodi, then pick a shape, a mood and a color. React, Web Component or CDN.";
// Versioned like the home image: link previews cache by URL. Regenerate from /og/docs.
const DOCS_OG_IMAGE = {
  url: "/opengraph-docs-v1.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "moodi docs: a thinking purple 3D ghost next to a React code snippet",
};

export const metadata: Metadata = {
  // absolute: the template would only add " | moodi" to a 4-character title
  title: { absolute: "moodi Docs – Install, Props, Moods and Imperative API" },
  description: DOCS_DESCRIPTION,
  alternates: { canonical: "/docs" },
  openGraph: {
    title: `moodi ${DOCS_TITLE.toLowerCase()}`,
    description: DOCS_OG_DESCRIPTION,
    url: "/docs",
    siteName: SITE_NAME,
    type: "article",
    locale: "en_US",
    images: [DOCS_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `moodi ${DOCS_TITLE.toLowerCase()}`,
    description: DOCS_OG_DESCRIPTION,
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    images: [DOCS_OG_IMAGE],
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "moodi docs",
    description: DOCS_DESCRIPTION,
    url: `${SITE_URL}/docs`,
    image: `${SITE_URL}${DOCS_OG_IMAGE.url}`,
    proficiencyLevel: "Beginner",
    about: { "@type": "SoftwareApplication", name: SITE_NAME, url: SITE_URL },
    author: { "@type": "Person", name: AUTHOR.name, alternateName: `@${AUTHOR.handle}`, url: AUTHOR.url },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: DOCS_TITLE, item: `${SITE_URL}/docs` },
    ],
  },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="no-scrollbar overflow-x-auto rounded-xl bg-chip px-4 py-3.5 font-mono text-[13px] leading-[1.7] text-fg">
      <code>{children}</code>
    </pre>
  );
}

function H2({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="mb-4 mt-14 scroll-mt-20 text-[20px] font-semibold tracking-[-0.02em]">
      {children}
    </h2>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-dvh">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-5 backdrop-blur">
        <Link href="/" className="flex items-center gap-1.5">
          <Moodi size={30} loading="interaction" poster="/posters/logo.webp" interactive={false} shadow={false} aria-hidden />
          <span className="text-[17px] font-semibold tracking-[-0.03em]">moodi</span>
          <span className="ml-2 text-[13px] text-muted">docs</span>
        </Link>
        <nav className="flex items-center gap-4 text-[13px] text-muted">
          <Link href="/" className="hover:text-fg">Playground</Link>
          <Link href="/test" className="hover:text-fg">Test</Link>
          <a href={GITHUB_URL} className="hover:text-fg">GitHub</a>
        </nav>
      </header>

      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-12">
        <div className="flex items-center gap-5">
          <Moodi mood="happy" size={96} loading="interaction" poster="/posters/mood-happy.webp" />
          <div>
            <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.03em]">moodi</h1>
            <p className="mt-1 text-[15px] text-muted">Tiny 3D mood buddies for your UI.</p>
          </div>
        </div>
        <p className="mt-8 max-w-[60ch] text-[15px] leading-relaxed text-muted">
          A soft 3D character you drop into any page with one line. Its face shows what is happening.
          No models or textures to download; three.js is a peer dependency. One shared WebGL context for every
          buddy on the page, rendering pauses off-screen, and reduced motion is respected.
        </p>

        <H2 id="install">Install</H2>
        <Code>npm i moodi three</Code>

        <H2 id="usage">Usage</H2>
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="mb-2 text-[14px] text-muted">React</h3>
            <Code>{`import { Moodi } from 'moodi/react';

<Moodi shape="blob" mood={isLoading ? 'loading' : 'idle'} color="#8fb996" />`}</Code>
          </div>
          <div>
            <h3 className="mb-2 text-[14px] text-muted">Web Component</h3>
            <Code>{`<moodi-buddy shape="ghost" mood="happy" color="#6c5ce7" size="160"></moodi-buddy>
<script type="module">import 'moodi';</script>`}</Code>
          </div>
          <div>
            <h3 className="mb-2 text-[14px] text-muted">CDN, no build step</h3>
            <Code>{`<script type="module" src="https://esm.sh/moodi"></script>
<moodi-buddy mood="thinking"></moodi-buddy>`}</Code>
          </div>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          The React component is safe to render on the server. three.js is loaded lazily in the browser, so
          importing <code className="font-mono text-fg">moodi/react</code> in Next.js never runs WebGL code on the server.
        </p>

        <H2 id="props">Props</H2>
        <PropsTable />
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          Booleans on the Web Component take <code className="font-mono text-fg">&quot;true&quot;</code> /{" "}
          <code className="font-mono text-fg">&quot;false&quot;</code>, e.g.{" "}
          <code className="font-mono text-fg">sound=&quot;true&quot;</code>.
        </p>

        <h3 className="mb-3 mt-8 text-[15px] font-medium">React only</h3>
        <ReactPropsTable />

        <H2 id="sound">Sound</H2>
        <p className="mb-4 text-[14px] leading-relaxed text-muted">
          Off by default. Turn it on and every mood change plays a short sound effect, synthesized in the browser
          (no audio files). It also plays once when the buddy first appears. Browsers only allow audio after a click,
          tap or key press, so a sound requested before that waits a few seconds for the first one.
        </p>
        <Code>{`<Moodi mood="happy" sound />

<moodi-buddy mood="happy" sound="true"></moodi-buddy>`}</Code>

        <H2 id="settle">Settle</H2>
        <p className="mb-4 text-[14px] leading-relaxed text-muted">
          Some moods keep moving: happy hops, error shakes, love floats with hearts. With{" "}
          <code className="font-mono text-fg">settle</code> the buddy plays the mood for that many milliseconds, then its
          body calms down to gentle idle breathing and the extras fade out, while the face keeps the expression. Every new
          mood (or reaction) starts the timer again.
        </p>
        <Code>{`<Moodi mood={done ? 'happy' : 'idle'} settle={3000} />

<moodi-buddy mood="happy" settle="3000"></moodi-buddy>`}</Code>

        <H2 id="loading">Fast first paint</H2>
        <p className="mb-4 text-[14px] leading-relaxed text-muted">
          Give the buddy a still image and let three.js load on the first interaction. The page paints the image
          instantly and the live 3D buddy takes over without a visible swap.
        </p>
        <Code>{`<Moodi poster="/ghost-idle.webp" loading="interaction" />

<!-- Web Component: any child is shown until the first 3D frame -->
<moodi-buddy><img src="/ghost-idle.webp" alt="" /></moodi-buddy>`}</Code>

        <H2 id="moods">Moods</H2>
        <MoodList />

        <H2 id="shapes">Shapes and colors</H2>
        <p className="text-[14px] leading-relaxed text-muted">
          Shapes: <ShapeNames />. Preset palettes are exported as{" "}
          <code className="font-mono text-fg">PALETTES</code>:
        </p>
        <Palettes />

        <H2 id="api">Imperative API and events</H2>
        <Code>{`const el = document.querySelector('moodi-buddy');
el.mood = 'thinking';
el.react('happy', { duration: 1200 }); // temporary reaction, then back to the current mood
el.sound = true;
el.addEventListener('moodchange', (e) => console.log(e.detail));
// e.detail: { mood, previous, reaction }
el.addEventListener('ready', () => {}); // first 3D frame drawn; the element also gets [ready]`}</Code>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          In React, pass a ref to reach the element, or use <code className="font-mono text-fg">onMoodChange</code> and{" "}
          <code className="font-mono text-fg">onReady</code>.
        </p>

      </main>
    </div>
  );
}
