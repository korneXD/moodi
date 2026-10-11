# Changelog

## 0.5.0

- New default color `#2b15d1` (also the `Iris` palette entry); black face by default.

## 0.4.0

- `settle-mood` (React `settleMood`): with `settle`, switch to this mood once the time is
  up, e.g. `mood="happy" settle={3000} settleMood="idle"` plays happy for 3 s, then rests in
  idle. The `mood` prop itself is unchanged; a new mood or reaction restarts the timer.

## 0.3.2

- Eyes and mouth sit in soft sockets and read as rounded, slightly raised features
  (a bump map drawn from the face, lit like the body).

## 0.3.1

- The light face color is now latte `#d1bead` (used automatically on very dark bodies).

## 0.3.0

- `settle` (ms): after a mood change the body calms down to idle breathing and mood extras
  fade out; the expression stays. `0` (default) keeps moving.

## 0.2.1

- Fix: `document.createElement('moodi-buddy')` threw "The result must not have attributes"
  once the element was defined; size now lives in a shadow stylesheet.
- Fix: poster children stay visible until the first 3D frame.

## 0.2.0

- `sound`: a short synthesized effect per mood (off by default).

## 0.1.2

- React: `poster`, `loading` (`idle` | `interaction` | `eager`) and `onReady`; `ready` event.
- Software WebGL (SwiftShader, llvmpipe) renders only on change at 1× pixels.
- Time-sliced frame loop; adaptive pixel density; squash on `size` changes.
- Face stays rigid while the eye dots follow the gaze; WebKit-safe face drawing.

## 0.1.1

- Black eyes and mouth by default (latte/cream only on very dark bodies).

## 0.1.0

- First release: `<moodi-buddy>` Web Component and `moodi/react`, 6 shapes, 11 moods.
