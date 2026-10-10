# moodi

**Tiny 3D mood buddies for your UI.**

A soft little 3D character you drop into any website with one line. Its face shows
what is happening — thinking, loading, happy, error, sleeping. Shape, color and
expression are all customizable. Everything is generated in code: no models, no
textures, nothing to download besides three.js.

![moodi](https://raw.githubusercontent.com/korneXD/moodi/main/apps/site/app/opengraph-image.png)

**Playground:** <https://moodi-site.vercel.app> · by [@itsk0rn3l](https://x.com/itsk0rn3l)

## Install

```bash
npm i moodi three
```

`three` is a peer dependency (>= 0.160). `react` is optional and only needed for `moodi/react`.

## Usage

### Web Component

```html
<moodi-buddy shape="ghost" mood="happy" color="#6c5ce7" size="160"></moodi-buddy>
<script type="module">import 'moodi';</script>
```

### React

```tsx
import { Moodi } from 'moodi/react';

<Moodi shape="blob" mood={isLoading ? 'loading' : 'idle'} color="#8fb996" />
```

`moodi/react` is SSR-safe (Next.js, Remix, …): three.js is loaded lazily in the
browser, so nothing WebGL-related runs on the server.

### CDN, no build step

```html
<script type="module" src="https://esm.sh/moodi"></script>
<moodi-buddy mood="thinking"></moodi-buddy>
```

## Props

| Prop (attribute)              | Type                                                         | Default     | Notes                                         |
| ----------------------------- | ------------------------------------------------------------ | ----------- | --------------------------------------------- |
| `shape`                       | `'ghost' \| 'pebble' \| 'blob' \| 'drop' \| 'bean' \| 'cube'` | `'ghost'`   | Body shape                                    |
| `mood`                        | `Mood` (see below)                                           | `'idle'`    | Changes are interpolated, never instant       |
| `color`                       | any CSS color                                                | `'#6c5ce7'` | Body color                                    |
| `faceColor` (`face-color`)    | any CSS color                                                | auto        | Eyes & mouth, auto-contrast with the body     |
| `cheekColor` (`cheek-color`)  | any CSS color                                                | auto        | Blush, derived from the body color            |
| `size`                        | `number \| string`                                           | `160`       | px, or any CSS length (`"10rem"`, `"40vw"`)   |
| `speed`                       | `number`                                                     | `1`         | `0` pauses                                    |
| `followCursor` (`follow-cursor`) | `boolean`                                                 | `true`      | Eyes (and slightly the body) follow the pointer |
| `interactive`                 | `boolean`                                                    | `true`      | Hover lift, click reaction                    |
| `shadow`                      | `boolean`                                                    | `true`      | Soft ground shadow                            |

Boolean attributes on the Web Component take `"true"` / `"false"`.

## Moods

`idle` · `thinking` · `loading` · `listening` · `speaking` · `happy` · `surprised` · `sad` · `error` · `sleeping` · `love`

## Imperative API

```js
const el = document.querySelector('moodi-buddy');
el.mood = 'thinking';
el.react('happy', { duration: 1200 }); // temporary reaction, then back to the current mood
el.addEventListener('moodchange', (e) => console.log(e.detail)); // { mood, previous, reaction }
```

In React, pass a `ref` (it points at the element) or use `onMoodChange`.

Also exported: `SHAPES`, `MOODS`, `PALETTES`, `MOOD_INFO`, `DEFAULTS`, `defineMoodi(tag?)`.

## Behaviour

- All buddies on a page share **one WebGL context**; dozens are fine.
- Rendering stops while a buddy is off-screen or the tab is hidden; paused buddies (`speed={0}`) only redraw when something changes.
- `prefers-reduced-motion`: only blinking and soft fades.
- Transparent background, pixel ratio capped at 2.
- `role="img"` and `aria-label="moodi: <mood>"` (set your own `aria-label` to override).
- ~11 kB gzip, three.js excluded.

## License

[MIT](./LICENSE) © itsk0rn3l
