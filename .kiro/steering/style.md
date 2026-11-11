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
- `--calm-bg`: #FFFFFF and `--calm-text`: #1D1D1F (crisis and health screens only)

Text contrast must pass WCAG AA on its background.

## Shapes

- Stairs go up from bottom left to top right. The "I" point is the lowest step, the goal is the lit step at the top.
- Obstacles: thin cobweb drawn across the step, with the person's phrase on the step.
- Fears: ghosts floating above the goal, each with the person's phrase under it.
- A ghost with a written step fades to about 15 % opacity and gets a small pumpkin-colored check.
- Rounded corners, generous space, one idea per screen. Buttons are rectangles with 10 px radius, not pills.
- System font stack. Headings bold and tight.

## Motion

- Ghosts float up and down slowly (4 to 6 seconds per cycle). Fading takes about 1.2 seconds.
- With `prefers-reduced-motion: reduce` there is no floating and no fade animation.
