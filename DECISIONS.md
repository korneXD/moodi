# Decisions

Choices made where the spec left room, or where the owner changed it.

## Owner overrides of the spec

- **Site stack: Next.js 16 + Tailwind CSS 4 on Vercel** (spec suggested Vite + React or Astro).
  It also doubles as the milestone-5 SSR test: every page imports `moodi/react` and is
  statically prerendered.
- **Defaults: `shape="ghost"`, `color="#6c5ce7"`** ("Iris", a darker blue-violet) instead of
  pebble / peach. Iris is the first palette entry; Lilac stays.
- **No URL query params.** The spec mirrored state into `?shape=…`; the owner did not want
  that in the address bar, so the playground keeps state in memory only.
- **Domain `getmoodi.dev`** instead of `moodi.dev`.
- **Repository is public** (`korneXD/moodi`) so the GitHub link in the header works.
- Header credits the author: `by @itsk0rn3l` with the X avatar (stored locally in
  `apps/site/public/itsk0rn3l.jpg`, no third-party request at runtime).
- Light eyes get a dark pupil; eyes and mouth are partly emissive so they glow.
- `size` is adjustable in the playground. The hero stays large; the slider scales it
  within the stage (capped) and shows up in the generated code.

## Library

- **One shared WebGL renderer for all instances.** Each buddy renders into the corner of a
  shared offscreen WebGL canvas and copies the pixels into its own 2D canvas
  (`drawImage`). Browsers cap WebGL contexts at ~16, and the playground alone shows 19
  buddies. `preserveDrawingBuffer: true` so `drawImage` always sees the current frame.
- **Shapes are one welded lat/long sphere, deformed per shape.** Same vertex count for every
  shape, so a shape change is a position lerp (plus a squash). Latitude rings keep round
  silhouettes (the ghost hem) smooth.
- **Face = canvas texture projected from the front in the shader** (object-space planar
  projection, faded out by normal). Works on every shape without per-shape UVs. The canvas
  is only redrawn when a face parameter actually changes.
- **Mood decorations** (thought bubbles, Z's, hearts, sound arcs, "!") are drawn in 2D on top
  of the 3D frame: crisp at any size and nearly free.
- `MeshStandardMaterial` with a shader rim term instead of `MeshPhysicalMaterial`: the
  sheen/clearcoat look is faked, the shader compiles much faster. The shared program is
  compiled with `compileAsync` (parallel compile where supported) before the first frame.
- Paused buddies (`speed=0`) skip rendering while nothing visible changes. The playground's
  rail and dock thumbnails are paused unless selected or hovered.
- Hidden tabs: `requestAnimationFrame` already stops there, so the loop does not check
  `document.hidden` (some embedded webviews report hidden while visible).
- Two entry points as specified (`moodi`, `moodi/react`). `moodi/react` is a `"use client"`
  module and loads `moodi` (and three.js) with a dynamic import, so it is SSR-safe. Its
  re-exported constants are client references in React Server Components.
- Booleans are passed to the element as `"true"`/`"false"` strings; React 19 would otherwise
  drop a `false` attribute, which reads as the default `true`.

## Site

- Theme: dark by default, light via the toggle (stored in `localStorage`, applied before
  paint). The stage glow is three radial gradients built from the accent with hue-shifted
  neighbours (`oklch(from …)`), blended `screen` on dark and `multiply` on light.
- `/lab` renders the full shape × mood matrix for visual checks (noindex).
- `/og`, `/og/icon` and `/og/readme` are compositions used to regenerate
  `public/opengraph-v2.png`, `app/icon.png`, `app/apple-icon.png` and
  `.github/assets/readme.png` from a real render (headless screenshot), not a drawing.
- Domain: `getmoodi.dev`. Like roastfast, the `www.` host is canonical and the apex
  redirects to it (308). `NEXT_PUBLIC_SITE_URL=https://www.getmoodi.dev` on Vercel;
  without it `SITE_URL` defaults to the same address.

## SEO and Vercel setup (mirrors roastfast)

- `lib/site.ts` holds `SITE_URL` (from `NEXT_PUBLIC_SITE_URL`), name, title, a ≤150-char meta
  description, a ≤120-char OG description, the X handle and `jsonLd()`.
- Root metadata: title template `%s | moodi`, keywords, category, author/creator, robots with
  `max-image-preview: large`, Open Graph + Twitter `summary_large_image` with a versioned
  image (`public/opengraph-v2.png`; bump the number whenever the picture changes, link
  previews cache by URL). Pages set `alternates.canonical`.
- `robots.ts` (disallows `/lab` and `/og`), `sitemap.ts` (`/`, `/docs`), a
  `SoftwareApplication` JSON-LD with the creator on the home page, a noindex 404.
- `next.config.ts`: `poweredByHeader: false` and the same security headers (CSP pinned to
  self, nosniff, frame DENY, referrer, permissions, HSTS).
- Vercel project: Node 24.x, region iad1, skew protection, `NEXT_PUBLIC_SITE_URL` for
  production and preview. Unlike roastfast the app is not at the repo root: the repo is a
  pnpm monorepo (the npm package lives next to the site), so the project's root directory
  is `apps/site`.
- Also shipped: `favicon.ico` (16/32/48), a web manifest with 192/512 and maskable icons,
  `appleWebApp`, a docs-specific OG/Twitter card (`public/opengraph-docs-v1.png`, rendered
  from `/og/docs`) with `TechArticle` + `BreadcrumbList` JSON-LD, `/llms.txt` and
  `/.well-known/security.txt` (expires 2027-10-10, renew before then).

## Performance on phones and GPU-less machines

PageSpeed runs WebGL in software, where continuous 3D rendering blocked the main thread
for ~26 s on mobile. Fixes:

- **Facade:** the site loads three.js on the first pointer, touch, key or scroll
  (`loading="interaction"`). Until then every buddy shows a WebP still captured from the
  live render (`public/posters`, 25 kB total), so the swap is invisible and the hero still
  is the LCP image (preloaded, `fetchPriority: high`). The stills only show for the
  default look; once anything changes, three.js is already loading.
- **Library:** `poster` / `loading` / `onReady` props, a `ready` event and `[ready]`
  attribute; light-DOM children of `<moodi-buddy>` act as the poster. Software WebGL is
  detected from the renderer string and drops to on-change frames at 1× pixels. The frame
  loop is time-sliced (10 ms budget, round-robin), and each buddy lowers its own pixel
  density when frames stay expensive.
- Result in Lighthouse with software GL: mobile 95–96, desktop 100, CLS 0.

## Heading

The visible intro (product sentence + Install button) was tried and removed at the
owner's request; the stage shows only the character and its mood. The product sentence
stays as a visually hidden `h1`, and the mood name below the character is an `h2`.

## Sound and size animation

- **Sound effects live in the package** (`core/sound.ts`, moodi 0.2.0) behind a `sound`
  attribute/prop, **off by default** (a UI component should not make noise unless asked);
  the playground turns it on and the generated code then includes `sound`. One short Web
  Audio effect per mood (no files), on every mood change and when the buddy first appears,
  but not when a click reaction returns to the current mood. Browsers block audio until a
  click, tap or key press: a sound requested earlier waits (6 s for the first appearance,
  1.2 s for a mood change) and plays once audio is allowed. The playground's **Sound**
  toggle is remembered in `localStorage`.
- **Size changes animate.** The hero keeps a fixed canvas and is scaled with a springy CSS
  transform around its feet, so the label stays put and the canvas never re-allocates
  while dragging the slider. The library also gives a small squash-and-stretch whenever
  `size` changes (`buddy.bump()`), which npm users get too.

## Custom element constructor (0.2.1)

The constructor used to set `--moodi-size` with `this.style.setProperty`, which adds a
`style` attribute while constructing. The spec forbids that, so
`document.createElement('moodi-buddy')` threw "The result must not have attributes" once the
element was defined (e.g. React creating it after `moodi` was imported). The host size now
lives in a shadow `<style>` (`:host{width;height}`), so the element never touches its own
attributes during construction or later; outside CSS still wins over `:host`. The poster
`<slot>` is appended in the constructor too (it was missing, so posters vanished on upgrade
instead of at the first frame).

## DataFast bot traffic

`apps/site/proxy.ts` (Next 16's renamed middleware) calls `trackAICrawlerRequest` from
`@datafast/ai-crawl` on every page request, without awaiting it (`event.waitUntil` inside),
so AI crawlers (GPTBot, ClaudeBot, …) show up in DataFast's Bot traffic card. The matcher
skips `/api`, `_next` assets and the favicon but keeps `robots.txt`, `llms.txt` and
`sitemap.xml`. Token auth is wired (`DATAFAST_BOT_TOKEN`) but optional; without the env var
the call simply sends no token.

## /test page

Ported from the owner's local `testmoodi` (Vite) playground and translated to English, as
two tabs on one page (`#test`, `#example`):

- **Test:** all six shapes, each loaded a different way: the React component, the Web
  Component (`import 'moodi'`) and the esm.sh CDN build registered as `<moodi-cdn>` (so it
  can't be confused with the npm copy). A badge turns green on the element's `ready` event;
  per-row sound toggles drive the `sound` attribute, only while the row is 60% in view.
- **Live example:** "Hush", a made-up journaling app whose landing page uses moodi for real
  UI state: a mood picker, a chat (listening → thinking → speaking) and a waitlist form
  (error / loading / success). It keeps its own light look and a Young Serif display face.

Styles are scoped under `.tp` (`app/test/test.css`) and use the site's theme tokens. The CSP
allows `https://esm.sh` for the CDN row.

## AI chat on /test

The "Hush" chat answers with a real model through `app/api/chat` (AI SDK 7 +
`@ai-sdk/openai`, the owner's own OpenAI key; AI Gateway was offered and declined).

- The model returns `{ mood, reply }` via structured output (`Output.object`); the route
  streams the reply as NDJSON chunks and sends the mood last. The buddy thinks until the
  first words arrive, speaks while they stream, then shows the mood the model picked.
- Default model `gpt-4.1-mini` (fast, cheap, no reasoning delay), override with
  `OPENAI_MODEL`. Replies are capped at 200 output tokens and 1–2 sentences.
- Guard rails for a public demo: same-origin only, best-effort per-IP limits (8/min,
  40/hour, in memory), 300-character messages, only the last 8 turns sent, a system prompt
  that keeps to the topic and points to emergency help for self-harm mentions.
- Without `OPENAI_API_KEY` (or on any error) the page falls back to the old canned replies,
  so the demo never breaks. The stream logic lives in `lib/chat-stream.ts` and was tested
  with `MockLanguageModelV4`.

## Settle (0.3.0)

`settle` (ms, default 0 = never): after a mood change the buddy plays the mood for that
long, then its body eases (0.7 s) to the idle breathing pose and mood extras (hearts, Z's,
bubbles, sound waves) fade out. The facial expression stays, so a waitlist success ends as
a calm, smiling buddy instead of hopping forever. The timer restarts on every mood change
or reaction. The playground has a "Settle after" control (Off/1s/3s/5s) that shows up in the
generated code; the /test example uses it on the chat (4 s) and waitlist (3 s) buddies,
and the chat buddy now sits on its own large card so its reactions are easy to follow.
