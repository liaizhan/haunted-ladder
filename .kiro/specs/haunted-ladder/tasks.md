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

- [x] 19. Ghosts fade where you type
  - [x] 19.1 Result screen layout: at 900 px and wider a two-column grid, staircase and heart in a sticky left column, the "Make the ghosts smaller" fields in the right column; below 900 px the ghost-steps block comes right after the staircase
    - _Requirements: 12.1, 12.2_
  - [x] 19.2 Each ghost-step field gets a small inline SVG ghost icon whose opacity follows its ghost (1 or 0.15), updated by the same onStepsChange path
    - _Requirements: 12.2_
  - [x] 19.3 Staircase readable on a phone: `buildStaircase` takes an optional width (or reads the container width) and for narrow containers uses a narrower viewBox and larger font with re-wrapping, so labels render at 13 CSS px or more at 375 px
    - _Requirements: 12.3_
  - [x] 19.4 Write property test for Property 15 and keep Property 14, accessibility and 360 px checks green
    - **Property 15: Readable on a phone**
    - **Validates: Requirements 12.3, 12.4**

- [x] 20. Dawn when the last ghost fades
  - [x] 20.1 Add `src/ui/dawn.ts` (`isDawn`, `setDawn`), the sun, the dawn sky gradient and the dawn line; call it from the same `onStepsChange` path in `main.ts`
    - _Requirements: 13.1, 13.2, 13.3_
  - [x] 20.2 CSS transitions (4 s in, 2 s out), instant under reduced motion, AA contrast on dawn colors, dawn included in the saved picture, nothing on calm screens
    - _Requirements: 13.4, 13.5, 13.6_
  - [x] 20.3 Write property test for Property 16 and extend the accessibility test with the dawn color pairs
    - **Property 16: Dawn comes only with every step**
    - **Validates: Requirements 13.1, 13.2, 13.3**

- [x] 21. A ghost dissolves into light
  - [x] 21.1 Add `src/ui/motes.ts` with `dissolve`, call it when a ghost's step goes from empty to non-empty, remove motes on finish, skip under reduced motion
    - _Requirements: 14.1, 14.2, 14.4_
  - [x] 21.2 Add `chime()` to `nightSound.ts` (Web Audio, fades, peak gain 0.15, only while the sound is on) and test it with the fake AudioContext
    - _Requirements: 14.3_
  - [x] 21.3 Write property test for Property 17
    - **Property 17: Motes leave no trace**
    - **Validates: Requirements 14.2, 14.4**

- [x] 22. Russian and Kazakh
  - [x] 22.1 Call the `ladder` MCP tool `get_ladder_questions` with `ru` and with `kk` and copy its question titles and hints into the dictionaries; record in a comment at the top of each locale file that these texts come from that tool
    - _Requirements: 15.3_
  - [x] 22.2 Add `src/i18n.ts` and `src/locales/{en,ru,kk}.ts`, move every interface string into them, add the EN / RU / KZ switch, save the choice, set `<html lang>`, send the language to `analyze_ladder`, add sample phrases per language
    - _Requirements: 15.1, 15.2, 15.4, 15.5, 15.6_
  - [x] 22.3 Write property test for Property 18 and extend the words check to the Russian forbidden words
    - **Property 18: Same words in every language**
    - **Validates: Requirements 15.2, 15.5**

- [x] 23. One click to a real ladder
  - [x] 23.1 "See a sample ladder" and `?demo=1` send the sample at once and show fog then result; the result shows "Sample ladder" and "Write my own"; update Property 13 tests and the app test to the new path
    - _Requirements: 16.1, 16.2, 16.3, 10.3, 10.4_

- [x] 24. A side staircase like the Ladder site and a clear heart
  - [x] 24.1 Rewrite `src/ui/staircase.ts` to Requirement 17: plates for every step on a side staircase with a floor line and a banister, numbers and the "me" and "goal" badges (new keys in all three locale files), note cards in one right column with leader lines, cobwebs in a plate corner, the lantern over the goal, ghosts inside the fear cards (keep `.ghost[data-ghost]`, `.ghost-body` with `translate(x y)`, `.ghost-float`, `.ghost-check`, `.ghost-label`, `.goal-light`, `.nearest`, `.cobweb`, `.moon` in the empty top left corner), one geometry for 300 to 680 px at 1 unit = 1 CSS px; keep `updateGhosts`, `wrapText` and the export path working
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.7, 17.8_
  - [x] 24.2 Rewrite `src/ui/heart.ts` and its CSS to a pulse panel above the staircase: crisp heart, pulse line in time with `--beat`, beat rate always written; reduced motion still; calm screens show no heart; update `main.ts` and the export picture if they need it
    - _Requirements: 17.6, 9.2, 9.3, 9.9_
  - [x] 24.3 Update the tests for Properties 14 and 15 and the other staircase, phone, accessibility, dawn, motes and export tests to the new picture, and write property tests for Properties 19 and 20
    - **Property 19: A side staircase that reads**
    - **Property 20: A clear heart apart from the text**
    - **Validates: Requirements 17.1 to 17.8**

- [x] 25. Kazakh night steppe art: the Zheztyrnaq turns into a Peri
  - [x] 25.1 In `src/ui/staircase.ts` add the backdrop `<image class="backdrop">` first in the SVG, replace the white ghost shape inside `.ghost-body` with two images (`.spirit-dark` Zheztyrnaq and `.spirit-light` Peri) plus a hidden `.spirit-turning` image, and add one emblem image (`.emblem` with `data-emblem="shanyraq|asyq|tumar|burkit"`) to every non-fear card; `applyGhostState` sets the image opacities instead of the 0.15 fade; build every address from `import.meta.env.BASE_URL`; keep every class and export listed in task 24.1
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.7_
  - [x] 25.2 CSS in `src/styles.css`: the turning animation (about 1 s, only under `prefers-reduced-motion: no-preference`), the dawn backdrop, the qobyz emblem on the ghost step heading and the legend block (works at 360 px and in the two-column layout); update `src/main.ts` or `src/ui/reading.ts` to add the legend after the stage on the result screen only
    - _Requirements: 18.1, 18.3, 18.5, 18.6, 18.9, 18.10_
  - [x] 25.3 New keys in all three locale files: `legendTitle` and `legendZheztyrnaq`, `legendPeri`, `legendShanyraq`, `legendAsyq`, `legendTumar`, `legendQobyz`, `legendBurkit`, using the English texts of Requirement 18.6 and these texts:
    - ru: "Кто живёт на этой лестнице"; "Жезтырнақ, дух с медными когтями из казахских легенд. Здесь это страх без шага."; "Пері, светлый дух тюркских сказаний. В неё превращается страх, когда ты пишешь маленький шаг."; "Шаңырақ, венец юрты: дом и место, откуда ты начинаешь."; "Асық, косточка из старой казахской игры: удача на ближайшем препятствии."; "Тұмар, народный оберег: защита на трудных ступенях."; "Қобыз, инструмент Қорқыт ата. По легенде, пока он играл, смерть не могла подойти."; "Бүркіт, беркут: свобода у твоей цели."
    - kk: "Бұл баспалдақта кім тұрады"; "Жезтырнақ, қазақ аңыздарындағы жез тырнақты кейіпкер. Мұнда ол әлі қадамы жоқ қорқыныш."; "Пері, түркі ертегілеріндегі жарқын рух. Кішкентай қадамыңды жазғанда қорқыныш соған айналады."; "Шаңырақ, киіз үйдің төбесі: үй және сен бастайтын орын."; "Асық, ата-бабамыздың ойыны: ең жақын кедергіде сәттілік."; "Тұмар, халықтық бойтұмар: қиын баспалдақтарда қорғаныс."; "Қобыз, Қорқыт атаның аспабы. Аңыз бойынша ол ойнап отырғанда ажал жақындай алмаған."; "Бүркіт, қыран құс: мақсатыңдағы еркіндік."
    - _Requirements: 18.6, 15.2_
  - [x] 25.4 In `src/ui/exportImage.ts` inline every `<image>` as a `data:` URL before drawing (fetch and FileReader, or an Image and a canvas); a picture that fails to load is removed and the save still works; mock the loading in tests
    - _Requirements: 18.8, 7.1, 7.2_
  - [x] 25.5 Update the existing tests that expect the ghost fade to 0.15 on the staircase (side staircase, export) to the new Peri state, keep Property 15 for the field icons, and write property tests for Property 21
    - **Property 21: The Zheztyrnaq turns into a Peri**
    - **Validates: Requirements 18.1 to 18.9**

- [ ] 26. Judge-ready README
  - Top block "Summary for judges": what it is, who it is for, the live link and the `?demo=1` link
  - A short GIF of one ghost fading and the heart slowing, and a captioned screenshot of every screen (intro, form, fog, staircase, all ghosts faded, crisis)
  - Numbers from the repo: requirements, correctness properties, tasks, steering files, hooks, test count
  - _Requirements: 8.5_
