# Design: Perseids starfall

## Data

`METEORS` in `src/main.ts`: an array of 40 tuples built with `Array.from({ length: 40 })`, each `[x %, y %, length px, cycle s, delay s]` from small integer steps (`i * 37 % 92`, `i * 23 % 42`, and so on). No `Math.random`, so the scene is the same on every load and in every screenshot.

## DOM

The waiting scene gets `div.w-meteors` (absolute, `inset: 0 0 25% 0`, `z-index: 1`, `pointer-events: none`) with 40 `span.w-meteor`. Each span gets the CSS variables `--x`, `--y`, `--l`, `--t`, `--d`. No text, so no `textContent` or `innerHTML` question.

## CSS

`.w-meteor` is a 2 px line with a white to gold gradient, turned `-35deg`, and a small glowing head in `::before`. The `w-meteor-fall` animation (fade in, slide 240 px, fade out, then rest) runs only inside `@media (prefers-reduced-motion: no-preference)`.

## Properties to test

- **S1:** the waiting screen has exactly 40 `.w-meteor` elements, all inside `.w-meteors`.
- **S2:** the crisis screen has no `.w-meteor`.
- **S3:** `w-meteor-fall` appears only inside a `prefers-reduced-motion: no-preference` block.
