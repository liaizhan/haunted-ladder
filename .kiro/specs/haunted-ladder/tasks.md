# Implementation Plan

- [x] 1. Set up the project
  - [x] Create a Vite + TypeScript (strict) app with `index.html`, `src/main.ts`, `src/styles.css`
  - [x] Add Vitest, jsdom and fast-check; `npm test` runs `vitest run`
  - [x] Set Vite `base` to `/haunted-ladder/`
  - [x] Add the palette variables from `style.md` and the system font stack
  - _Requirements: 8.1, 8.4_

- [x] 2. Domain: ladder draft and request
  - [x] 2.1 Implement `validatePhrase`, `validateDraft` and `buildRequest` in `src/domain/ladder.ts`
    - _Requirements: 1.3, 1.4, 1.5, 2.1_
  - [x] 2.2 Write property tests for Properties 1, 2 and 3
    - _Requirements: 1.3, 1.4, 2.1, 3.2_

- [x] 3. Domain: server answer
  - [x] 3.1 Implement `parseAnswer` and `rewriteUtm` in `src/domain/server.ts`
    - Read `result.structuredContent`, fall back to `result.content[0].text`
    - Return `{kind:'error'}` for any unexpected shape, never throw
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 4.3_
  - [x] 3.2 Write property tests for Properties 4 and 8
    - _Requirements: 2.6, 4.3_

- [x] 4. Domain: ghosts and storage
  - [x] 4.1 Implement `ghostsFromReading`, `isFaded`, `allFaded` in `src/domain/ghosts.ts`
    - _Requirements: 3.3, 3.4, 5.2, 5.3, 5.4_
  - [x] 4.2 Implement `save`, `load`, `clear` in `src/domain/storage.ts` with key `haunted-ladder:v1`
    - _Requirements: 1.6, 1.7, 5.5, 6.4_
  - [x] 4.3 Write property tests for Properties 6, 7 and 9
    - _Requirements: 1.6, 3.3, 5.2, 5.3, 5.4, 5.5_

- [x] 5. API client
  - [x] 5.1 Implement `analyze` in `src/api/ladderClient.ts` with injectable `fetch` and a 20 second timeout
    - _Requirements: 2.1, 2.2, 2.6, 2.7_
  - [x] 5.2 Test with a fake `fetch`: reading, crisis, health, rpc error, broken JSON, timeout
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 6. Form screen
  - [x] Intro screen with "Start", no price, no sign-in
  - [x] One question per screen, live hints, add and remove rows up to 5, "Clear my answers"
  - [x] Save the draft on every change
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 8.2_

- [x] 7. Haunted staircase
  - [x] 7.1 Build the SVG in `src/ui/staircase.ts`: steps bottom up, cobwebs on blocks, lit goal, ghosts above the goal, nearest block highlighted
    - Render phrases with SVG text nodes only
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2_
  - [x] 7.2 Slow ghost float and fade with CSS; none under `prefers-reduced-motion`
    - _Requirements: 3.6_
  - [x] 7.3 Write a DOM property test for Property 10
    - _Requirements: 3.5_

- [x] 8. Reading and steps
  - [x] Show insights, two questions, disclaimer and the rewritten diagnostic link
  - [x] One step field per ghost; fade on a non-empty step, restore when cleared
  - [x] Closing line and "Save my ladder" when all ghosts have a step
  - [x] Save steps to storage
  - _Requirements: 4.1, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Calm screens
  - [x] 9.1 Crisis screen: add class `calm` to `<body>`, remove every spooky element, show only `message`, `helpUrl` and "Back to the start", clear the draft
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 9.2 Health and error screens with "Edit answers" and "Try again"
    - _Requirements: 2.5, 2.6_
  - [x] 9.3 Write a DOM property test for Property 5
    - _Requirements: 6.1, 6.3, 6.4_

- [x] 10. Save as PNG
  - [x] Serialize the SVG, draw on a canvas at 2x, add the credit line, download `haunted-ladder.png`
  - [x] Show a short message if saving fails
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11. Accessibility pass
  - Keyboard-only path through every screen, visible focus ring, labels for ghosts and steps, AA contrast check
  - _Requirements: 8.2, 8.3, 8.4_

- [x] 12. The heart
  - [x] 12.1 Implement `beatsPerMinute` and `secondsPerBeat` in `src/domain/pulse.ts`
    - _Requirements: 9.2, 9.3_
  - [x] 12.2 Write a property test for Property 11
    - _Requirements: 9.2, 9.3_
  - [x] 12.3 Build the x-ray heart in `src/ui/heart.ts` behind the staircase; update `--beat` whenever a ghost fades or comes back; ease to 60 bpm when all ghosts are faded
    - _Requirements: 9.1, 9.2, 9.3, 9.9_

- [x] 13. Fog, moonlight and living details
  - [x] Fog while waiting, lift on reading, steps lit one by one bottom up (`src/ui/fog.ts`)
  - [x] Cobwebs sway; an unfaded ghost drifts away from the pointer and from keyboard focus
  - [x] All of it off under `prefers-reduced-motion`
  - _Requirements: 2.2, 9.4, 9.5, 9.9_

- [x] 14. Night sound
  - [x] 14.1 Implement `saveSettings` and `loadSettings` in `src/domain/settings.ts`
    - _Requirements: 9.7_
  - [x] 14.2 Implement `src/ui/nightSound.ts` with the Web Audio API: wind, heartbeat in time with `--beat`, 2 second fades, `kill()`
    - _Requirements: 9.6, 9.10_
  - [x] 14.3 Add the "Night sound" toggle button with `aria-pressed`; call `kill()` on every calm screen
    - _Requirements: 6.1, 9.6, 9.8_
  - [x] 14.4 Write tests for Property 12 with a fake `AudioContext`, and extend the Property 5 test to cover fog, heart and sound
    - _Requirements: 6.1, 9.6, 9.7, 9.8_

- [x] 15. Wire the app
  - [x] 15.1 Hold one plain state object in `src/main.ts` (screen, draft, answer, steps done, sound on) and rebuild the current screen from it on every change: intro, form, result (staircase + reading + steps + "Save my ladder"), calm (crisis, health, error)
    - _Requirements: 1.1, 2.3, 3.1, 4.1, 5.1, 7.1_
  - [x] 15.2 "Show my ladder" validates the draft, shows the fog while `ladderClient` calls the server, then routes `parseAnswer` to the result or the right calm screen; crisis clears storage and offers only "Back to the start"
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.4_
  - [x] 15.3 Start the heart, fog and night sound only on the result screen and stop them on every calm screen and when leaving it
    - _Requirements: 6.1, 9.6, 9.8_
  - [x] 15.4 Write a jsdom test that walks intro, form, result with a fake client, and each calm screen
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 6.1, 6.3_

- [x] 16. Deploy
  - GitHub Actions workflow `.github/workflows/deploy.yml`: install, test, build, deploy to GitHub Pages on push to `main`
  - _Requirements: 8.5_

- [x] 17. Demo link
  - [x] 17.1 Implement `isDemo` and `demoDraft` in `src/domain/demo.ts` (3 fears: "People will laugh at my videos", "I will spend the money and sell nothing", "My family will see me fail")
    - _Requirements: 10.1_
  - [x] 17.2 Load the demo in memory on `?demo=1`, show the sample line and "Clear", never save it
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 17.3 Write a property test for Property 13
    - _Requirements: 10.1, 10.3_

- [x] 18. Haunted entrance and costume polish
  - [x] 18.1 Add `src/ui/intro.ts` with the inline SVG night scene, the flickering title and the "See a sample ladder" link to `?demo=1`; use it from `main.ts` for the intro screen
    - _Requirements: 11.1, 11.2_
  - [x] 18.2 In `staircase.ts` make step labels sit on solid step fills above the heart, place ghost labels so they never overlap, and add the gentle float to unfaded ghosts (CSS class with per-ghost `animation-delay`)
    - _Requirements: 11.3, 11.4_
  - [x] 18.3 Write property test for Property 14 (labels stay readable)
    - **Property 14: Labels stay readable**
    - **Validates: Requirements 11.3**
  - [x] 18.4 CSS: flicker and float only under `prefers-reduced-motion: no-preference`; calm screens hide the intro scene; layout fits 360 px without horizontal scroll. Extend the accessibility test with the new color pairs and the reduced-motion rule
    - _Requirements: 11.5, 11.6, 11.7_

- [ ] 19. Judge-ready README
  - Top block "Summary for judges": what it is, who it is for, the live link and the `?demo=1` link
  - A short GIF of one ghost fading and the heart slowing, and a captioned screenshot of every screen (intro, form, fog, staircase, all ghosts faded, crisis)
  - Numbers from the repo: requirements, correctness properties, tasks, steering files, hooks, test count
  - _Requirements: 8.5_
