---
inclusion: fileMatch
fileMatchPattern: ["src/**/*.css", "src/ui/**/*.ts", "index.html"]
---

# Visual style: the costume

A night staircase under a big moon. Spooky and beautiful, never ugly or scary.

## Palette (CSS variables in `src/styles.css`)

- `--night`: #14112B (page background)
- `--night-2`: #221C45 (stairs, cards)
- `--moon`: #F4EFE6 (main text, the moon, ghosts at full strength)
- `--mist`: #A9A3C7 (secondary text, cobwebs)
- `--pumpkin`: #FF8A3D (one accent: primary buttons, focus ring, the goal light)
- `--glow`: #FF5A36 (only the hot center of the x-ray heart)
- `--calm-bg`: #FFFFFF and `--calm-text`: #1D1D1F (crisis and health screens only)

Text contrast must pass WCAG AA on its background.

## Shapes

- Stairs go up from bottom left to top right. The "I" point is the lowest step, the goal is the lit step at the top.
- Obstacles: thin cobweb drawn across the step, with the person's phrase on the step.
- Fears: ghosts floating above the goal, each with the person's phrase under it.
- A ghost with a written step fades to about 15 % opacity and gets a small pumpkin-colored check.
- Rounded corners, generous space, one idea per screen. Buttons are rectangles with 10 px radius, not pills.
- System font stack. Headings bold and tight.

## The x-ray heart

- Drawn behind the staircase like a medical x-ray: black-blue background, the heart translucent in cold grey-blue (#8FA3BF at 35 % opacity, thin lighter outlines for the chambers and vessels).
- Its center glows warm red-orange (`--glow`: #FF5A36 fading to `--pumpkin`), like a hot spot on a scan. The glow grows with each beat and is softer when all ghosts are faded.
- Anatomical and beautiful, never bloody: no blood, no wounds, no gore.
- Beat: a quick scale to 1.04 and back, then a smaller second pulse ("lub-dub"), one cycle per `--beat` seconds.

## Fog and moonlight

- Fog: two layers of soft blurred shapes in `--mist` at 20 to 35 % opacity, drifting sideways (20 to 30 seconds per cycle).
- When the reading arrives the fog fades out in 1.5 seconds and the steps light up one by one from the bottom, 150 ms apart, as if the moon reaches them.

## Motion

- Ghosts float up and down slowly (4 to 6 seconds per cycle). Fading takes about 1.2 seconds.
- Cobwebs sway a few degrees (6 to 8 seconds per cycle). An unfaded ghost drifts up to 12 px away from the pointer or the focused field.
- With `prefers-reduced-motion: reduce` there is no floating, no fade animation, no beat, no fog drift and no swaying.
