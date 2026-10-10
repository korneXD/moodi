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
