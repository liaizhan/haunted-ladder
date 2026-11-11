---
inclusion: always
---

# Structure

```
index.html
src/
  main.ts            app start, screen switching
  styles.css         palette variables and layout
  domain/            pure logic, no DOM (easy to test)
    ladder.ts        types, form validation, request building
    server.ts        parse the analyze_ladder answer into a typed result
    ghosts.ts        ghost state: which fear has a step, fade rules
    storage.ts       save and load the draft in localStorage
    pulse.ts         heart rate from the number of unfaded ghosts
    settings.ts      the sound on/off choice
    demo.ts          the ?demo=1 sample ladder for judges
  api/
    ladderClient.ts  fetch call to https://108psy.com/mcp
  ui/
    form.ts          the questions screen
    staircase.ts     SVG staircase, cobwebs and ghosts
    reading.ts       insights, questions, step inputs, save button
    calm.ts          crisis and health screens
    exportImage.ts   SVG to PNG download
    heart.ts         x-ray heart behind the staircase
    fog.ts           fog while waiting, moonlight on the steps
    nightSound.ts    Web Audio wind and heartbeat, off until pressed
tests/               Vitest and fast-check tests, mirroring src/
.github/workflows/deploy.yml
```

- Pure logic lives in `src/domain` and has property-based tests.
- UI modules take data in and return DOM nodes. They do not call the network.
- File names in camelCase, one module per concern, no default exports.
