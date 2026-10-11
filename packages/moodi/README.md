# moodi

**Tiny 3D mood buddies for your UI.**

A soft little 3D character you drop into any website with one line. Its face shows
what is happening — thinking, loading, happy, error, sleeping. Shape, color and
expression are all customizable. Everything is generated in code: no models, no
textures, nothing to download besides three.js.

![moodi](https://raw.githubusercontent.com/korneXD/moodi/main/.github/assets/readme.png)

**Playground:** <https://www.getmoodi.dev> · by [@itsk0rn3l](https://x.com/itsk0rn3l)

## Install

```bash
npm i moodi three
```

`three` is a peer dependency (>= 0.160). `react` is optional and only needed for `moodi/react`.

## Usage

### Web Component

```html
<moodi-buddy shape="ghost" mood="happy" color="#2b15d1" size="160"></moodi-buddy>
<script type="module">import 'moodi';</script>
```

### React

```tsx
import { Moodi } from 'moodi/react';

<Moodi shape="blob" mood={isLoading ? 'loading' : 'idle'} color="#8fb996" />
```

`moodi/react` is SSR-safe (Next.js, Remix, …): three.js is loaded lazily in the
browser, so nothing WebGL-related runs on the server.

React-only props:

| Prop           | Type                                   | Default  | Notes                                                                 |
| -------------- | -------------------------------------- | -------- | --------------------------------------------------------------------- |
| `poster`       | `string`                               | —        | Image shown until the first 3D frame (e.g. a still of the same buddy) |
| `loading`      | `'idle' \| 'interaction' \| 'eager'`    | `'idle'` | When to load three.js; `'interaction'` waits for the first pointer, touch, key or scroll |
| `onMoodChange` | `(detail) => void`                     | —        | Same as the `moodchange` event                                        |
| `onReady`      | `() => void`                           | —        | First 3D frame is on screen                                           |

`poster` + `loading="interaction"` keeps three.js out of the critical path entirely: the
page paints the still instantly and the live buddy takes over on the first interaction.
With the Web Component, put an `<img>` inside `<moodi-buddy>`; it shows until the first frame.

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
| `color`                       | any CSS color                                                | `'#2b15d1'` | Body color                                    |
| `faceColor` (`face-color`)    | any CSS color                                                | auto        | Eyes & mouth, auto-contrast with the body     |
| `cheekColor` (`cheek-color`)  | any CSS color                                                | auto        | Blush, derived from the body color            |
| `size`                        | `number \| string`                                           | `160`       | px, or any CSS length (`"10rem"`, `"40vw"`)   |
| `speed`                       | `number`                                                     | `1`         | `0` pauses                                    |
| `followCursor` (`follow-cursor`) | `boolean`                                                 | `true`      | Eyes (and slightly the body) follow the pointer |
| `interactive`                 | `boolean`                                                    | `true`      | Hover lift, click reaction                    |
| `shadow`                      | `boolean`                                                    | `true`      | Soft ground shadow                            |
| `sound`                       | `boolean`                                                    | `false`     | Short synthesized effect per mood (and when it appears) |
| `settle`                      | `number`                                                     | `0`         | ms after a mood change when the body calms to idle breathing (expression stays); `0` = never |
| `settleMood` (`settle-mood`)  | `Mood`                                                       | —           | With `settle`: the mood to rest in once the time is up (e.g. happy for 2 s, then idle) |

Boolean attributes on the Web Component take `"true"` / `"false"`.

## Moods

`idle` · `thinking` · `loading` · `listening` · `speaking` · `happy` · `surprised` · `sad` · `error` · `sleeping` · `love`

## Imperative API

```js
const el = document.querySelector('moodi-buddy');
el.mood = 'thinking';
el.react('happy', { duration: 1200 }); // temporary reaction, then back to the current mood
el.addEventListener('moodchange', (e) => console.log(e.detail)); // { mood, previous, reaction }
el.addEventListener('ready', () => {}); // first frame rendered; the element also gets a [ready] attribute
```

In React, pass a `ref` (it points at the element) or use `onMoodChange`.

Also exported: `SHAPES`, `MOODS`, `PALETTES`, `MOOD_INFO`, `DEFAULTS`, `defineMoodi(tag?)`.

## Behaviour

- All buddies on a page share **one WebGL context**; dozens are fine.
- Rendering stops while a buddy is off-screen or the tab is hidden; paused buddies (`speed={0}`) only redraw when something changes.
- `prefers-reduced-motion`: only blinking and soft fades.
- Software WebGL (SwiftShader, llvmpipe): no continuous animation, frames only on change, 1× pixels.
- Changing `size` gives a little squash-and-stretch.
- Sound is opt-in (`sound` / `sound="true"`): one tiny Web Audio effect per mood, no audio files.
  Browsers only allow audio after a click, tap or key press; a sound requested earlier waits a
  few seconds for that first gesture.
- Transparent background, pixel ratio capped at 2.
- `role="img"` and `aria-label="moodi: <mood>"` (set your own `aria-label` to override).
- ~11 kB gzip, three.js excluded.

## License

[MIT](./LICENSE) © itsk0rn3l
