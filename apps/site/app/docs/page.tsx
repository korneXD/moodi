import type { Metadata } from "next";
import Link from "next/link";
import { Moodi } from "moodi/react";
import { MoodList, Palettes, PropsTable, ShapeNames } from "./parts";
import { GITHUB_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Docs — moodi",
  description: "Install moodi and drop a tiny 3D mood buddy into any website. Props, moods, events and the imperative API.",
};

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
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-5 backdrop-blur">
        <Link href="/" className="flex items-center gap-1.5">
          <Moodi size={30} interactive={false} shadow={false} aria-hidden />
          <span className="text-[17px] font-semibold tracking-[-0.03em]">moodi</span>
          <span className="ml-2 text-[13px] text-muted">docs</span>
        </Link>
        <nav className="flex items-center gap-4 text-[13px] text-muted">
          <Link href="/" className="hover:text-fg">Playground</Link>
          <a href={GITHUB_URL} className="hover:text-fg">GitHub</a>
        </nav>
      </header>

      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-12">
        <div className="flex items-center gap-5">
          <Moodi mood="happy" size={96} />
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
el.addEventListener('moodchange', (e) => console.log(e.detail));
// e.detail: { mood, previous, reaction }`}</Code>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          In React, pass a ref to reach the element, or use <code className="font-mono text-fg">onMoodChange</code>.
        </p>

      </main>
    </div>
  );
}
