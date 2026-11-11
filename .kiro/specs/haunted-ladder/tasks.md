# Implementation Plan

- [ ] 1. Set up the project
  - Create a Vite + TypeScript (strict) app with `index.html`, `src/main.ts`, `src/styles.css`
  - Add Vitest, jsdom and fast-check; `npm test` runs `vitest run`
  - Set Vite `base` to `/haunted-ladder/`
  - Add the palette variables from `style.md` and the system font stack
  - _Requirements: 8.1, 8.4_

- [ ] 2. Domain: ladder draft and request
  - [ ] 2.1 Implement `validatePhrase`, `validateDraft` and `buildRequest` in `src/domain/ladder.ts`
    - _Requirements: 1.3, 1.4, 1.5, 2.1_
  - [ ] 2.2 Write property tests for Properties 1, 2 and 3
    - _Requirements: 1.3, 1.4, 2.1, 3.2_

- [ ] 3. Domain: server answer
  - [ ] 3.1 Implement `parseAnswer` and `rewriteUtm` in `src/domain/server.ts`
    - Read `result.structuredContent`, fall back to `result.content[0].text`
    - Return `{kind:'error'}` for any unexpected shape, never throw
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 4.3_
  - [ ] 3.2 Write property tests for Properties 4 and 8
    - _Requirements: 2.6, 4.3_

- [ ] 4. Domain: ghosts and storage
  - [ ] 4.1 Implement `ghostsFromReading`, `isFaded`, `allFaded` in `src/domain/ghosts.ts`
    - _Requirements: 3.3, 3.4, 5.2, 5.3, 5.4_
  - [ ] 4.2 Implement `save`, `load`, `clear` in `src/domain/storage.ts` with key `haunted-ladder:v1`
    - _Requirements: 1.6, 1.7, 5.5, 6.4_
  - [ ] 4.3 Write property tests for Properties 6, 7 and 9
    - _Requirements: 1.6, 3.3, 5.2, 5.3, 5.4, 5.5_

- [ ] 5. API client
  - [ ] 5.1 Implement `analyze` in `src/api/ladderClient.ts` with injectable `fetch` and a 20 second timeout
    - _Requirements: 2.1, 2.2, 2.6, 2.7_
  - [ ] 5.2 Test with a fake `fetch`: reading, crisis, health, rpc error, broken JSON, timeout
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 6. Form screen
  - Intro screen with "Start", no price, no sign-in
  - One question per screen, live hints, add and remove rows up to 5, "Clear my answers"
  - Save the draft on every change
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 8.2_

- [ ] 7. Haunted staircase
  - [ ] 7.1 Build the SVG in `src/ui/staircase.ts`: steps bottom up, cobwebs on blocks, lit goal, ghosts above the goal, nearest block highlighted
    - Render phrases with SVG text nodes only
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2_
  - [ ] 7.2 Slow ghost float and fade with CSS; none under `prefers-reduced-motion`
    - _Requirements: 3.6_
  - [ ] 7.3 Write a DOM property test for Property 10
    - _Requirements: 3.5_

- [ ] 8. Reading and steps
  - Show insights, two questions, disclaimer and the rewritten diagnostic link
  - One step field per ghost; fade on a non-empty step, restore when cleared
  - Closing line and "Save my ladder" when all ghosts have a step
  - Save steps to storage
  - _Requirements: 4.1, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. Calm screens
  - [ ] 9.1 Crisis screen: add class `calm` to `<body>`, remove every spooky element, show only `message`, `helpUrl` and "Back to the start", clear the draft
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ] 9.2 Health and error screens with "Edit answers" and "Try again"
    - _Requirements: 2.5, 2.6_
  - [ ] 9.3 Write a DOM property test for Property 5
    - _Requirements: 6.1, 6.3, 6.4_

- [ ] 10. Save as PNG
  - Serialize the SVG, draw on a canvas at 2x, add the credit line, download `haunted-ladder.png`
  - Show a short message if saving fails
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 11. Accessibility pass
  - Keyboard-only path through every screen, visible focus ring, labels for ghosts and steps, AA contrast check
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 12. The heart
  - [ ] 12.1 Implement `beatsPerMinute` and `secondsPerBeat` in `src/domain/pulse.ts`
    - _Requirements: 9.2, 9.3_
  - [ ] 12.2 Write a property test for Property 11
    - _Requirements: 9.2, 9.3_
  - [ ] 12.3 Build the x-ray heart in `src/ui/heart.ts` behind the staircase; update `--beat` whenever a ghost fades or comes back; ease to 60 bpm when all ghosts are faded
    - _Requirements: 9.1, 9.2, 9.3, 9.9_

- [ ] 13. Fog, moonlight and living details
  - Fog while waiting, lift on reading, steps lit one by one bottom up (`src/ui/fog.ts`)
  - Cobwebs sway; an unfaded ghost drifts away from the pointer and from keyboard focus
  - All of it off under `prefers-reduced-motion`
  - _Requirements: 2.2, 9.4, 9.5, 9.9_

- [ ] 14. Night sound
  - [ ] 14.1 Implement `saveSettings` and `loadSettings` in `src/domain/settings.ts`
    - _Requirements: 9.7_
  - [ ] 14.2 Implement `src/ui/nightSound.ts` with the Web Audio API: wind, heartbeat in time with `--beat`, 2 second fades, `kill()`
    - _Requirements: 9.6, 9.10_
  - [ ] 14.3 Add the "Night sound" toggle button with `aria-pressed`; call `kill()` on every calm screen
    - _Requirements: 6.1, 9.6, 9.8_
  - [ ] 14.4 Write tests for Property 12 with a fake `AudioContext`, and extend the Property 5 test to cover fog, heart and sound
    - _Requirements: 6.1, 9.6, 9.7, 9.8_

- [ ] 15. Deploy
  - GitHub Actions workflow `.github/workflows/deploy.yml`: install, test, build, deploy to GitHub Pages on push to `main`
  - _Requirements: 8.5_

- [ ] 16. Demo link
  - [ ] 16.1 Implement `isDemo` and `demoDraft` in `src/domain/demo.ts` (3 fears: "People will laugh at my videos", "I will spend the money and sell nothing", "My family will see me fail")
    - _Requirements: 10.1_
  - [ ] 16.2 Load the demo in memory on `?demo=1`, show the sample line and "Clear", never save it
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [ ] 16.3 Write a property test for Property 13
    - _Requirements: 10.1, 10.3_

- [ ] 17. Judge-ready README
  - Top block "Summary for judges": what it is, who it is for, the live link and the `?demo=1` link
  - A short GIF of one ghost fading and the heart slowing, and a captioned screenshot of every screen (intro, form, fog, staircase, all ghosts faded, crisis)
  - Numbers from the repo: requirements, correctness properties, tasks, steering files, hooks, test count
  - _Requirements: 8.5_
