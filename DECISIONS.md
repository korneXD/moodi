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
- `/og` and `/og/icon` are compositions used to regenerate `opengraph-image.png`,
  `icon.png` and `apple-icon.png` from a real render (headless screenshot), not a drawing.
- Domain: `moodi.dev` is not registered yet; `SITE_URL` falls back to the Vercel
  production URL.
