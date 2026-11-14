# Requirements Document

## Introduction

Haunted Ladder is a one-page web app built on the Ladder method by Aizhan Li, author of the Ladder method. A person writes a goal, where they are now, 3 to 5 obstacles and up to 5 fears. The app draws a night staircase: obstacles are cobwebs on the stairs, fears are ghosts above the goal. The public Ladder MCP server (`https://108psy.com/mcp`, tool `analyze_ladder`, built before the hackathon) returns the reading. For each ghost the person writes one small step, and the ghost fades. The finished ladder can be saved as a PNG. The app has no backend and stores nothing outside the person's browser.

## Requirements

### Requirement 1: Write the ladder

**User Story:** As a person who feels stuck, I want to write my goal, my starting point, my obstacles and my fears in a few short fields, so that I can see what stands between me and my goal.

#### Acceptance Criteria

1. WHEN the app opens THEN the system SHALL show one intro screen with a short explanation and a "Start" button, with no price and no sign-in.
2. WHEN the person fills the form THEN the system SHALL ask for a goal, an "I am here" point, 3 to 5 obstacles and 0 to 5 fears, one idea per screen.
3. WHEN a field is empty, only spaces, or longer than 300 characters THEN the system SHALL keep the "Next" button disabled and show a short hint next to that field.
4. WHEN fewer than 3 obstacles are filled THEN the system SHALL not allow sending the ladder.
5. WHEN the person adds a sixth obstacle or a sixth fear THEN the system SHALL not add the field and SHALL say that 5 is the limit.
6. WHEN the person types THEN the system SHALL save the draft to `localStorage` so a page reload does not lose it.
7. WHEN the person presses "Clear my answers" THEN the system SHALL remove the draft from `localStorage` and return to the intro screen.

### Requirement 2: Get the reading from the Ladder server

**User Story:** As a person, I want the app to read my ladder with the Ladder method, so that I learn what my ladder shows.

#### Acceptance Criteria

1. WHEN the person presses "Show my ladder" THEN the system SHALL send one JSON-RPC 2.0 `tools/call` request for `analyze_ladder` to `https://108psy.com/mcp` with `language: "en"` and the trimmed phrases.
2. WHEN the request is in progress THEN the system SHALL show a calm waiting state and disable the button so the request is not sent twice.
3. WHEN the answer has `kind: "reading"` THEN the system SHALL show the staircase (Requirement 3) and the reading (Requirement 4).
4. WHEN the answer has `kind: "crisis"` THEN the system SHALL follow Requirement 6.
5. WHEN the answer has `kind: "health"` THEN the system SHALL show the server `message` in the calm theme with a button to edit the answers, and SHALL not draw ghosts.
6. WHEN the network fails, the server returns a JSON-RPC `error`, or the answer does not match the contract THEN the system SHALL show a short error with a "Try again" button and SHALL not invent a reading.
7. WHEN the request takes longer than 20 seconds THEN the system SHALL cancel it and show the error state.

### Requirement 3: The haunted staircase

**User Story:** As a person, I want to see my ladder as a night staircase with cobwebs and ghosts, so that my fears become visible and smaller.

#### Acceptance Criteria

1. WHEN a reading arrives THEN the system SHALL draw the steps from the bottom up in the order the server sent, with the "I" point lowest and the goal lit at the top.
2. WHEN a step has `zone: "block"` THEN the system SHALL draw a cobweb across that step and show the person's phrase exactly as written.
3. WHEN a step has `zone: "fear"` THEN the system SHALL draw one ghost above the goal with the person's phrase under it.
4. WHEN the reading has no fears THEN the system SHALL draw no ghosts and SHALL say that no ghosts were found above the goal.
5. WHEN the person's phrase is shown THEN the system SHALL render it as text only (never as HTML).
6. WHEN `prefers-reduced-motion: reduce` is set THEN the system SHALL draw everything without floating or fading animation.

### Requirement 4: The reading

**User Story:** As a person, I want short insights and two questions about my ladder, so that I can think about my next move.

#### Acceptance Criteria

1. WHEN a reading arrives THEN the system SHALL show `insights`, the two `questions` and the `disclaimer` from the server.
2. WHEN `nearestBlock` is present THEN the system SHALL highlight that obstacle on the staircase as the nearest one.
3. WHEN the reading shows the diagnostic link THEN the system SHALL replace `utm_source=chatgpt_plugin` in `fullDiagnostic.url` with `utm_source=haunted_ladder` and keep every other part of the URL.
4. WHEN the reading is shown THEN the system SHALL not show any price or subscription offer.

### Requirement 5: Make the ghosts fade

**User Story:** As a person, I want to write one small step for each fear, so that I see the ghost fade and leave with a plan.

#### Acceptance Criteria

1. WHEN ghosts are drawn THEN the system SHALL show one "My small step this week" field under each ghost.
2. WHEN the step field for a ghost contains at least one non-space character THEN the system SHALL fade that ghost and mark it with a check.
3. WHEN the step field is cleared or contains only spaces THEN the system SHALL bring the ghost back to full strength.
4. WHEN every ghost has a step THEN the system SHALL show a short closing line and enable "Save my ladder".
5. WHEN the person writes steps THEN the system SHALL save them in `localStorage` together with the draft.

### Requirement 6: Crisis safety

**User Story:** As a person in a hard moment, I want the app to drop the costume and show me where to get help, so that I am not met with ghosts when I need support.

#### Acceptance Criteria

1. WHEN the answer has `kind: "crisis"` THEN the system SHALL remove the staircase, ghosts, cobwebs, moon, fog, the heart and every Halloween element from the page, and SHALL stop all sound at once.
2. WHEN the crisis screen is shown THEN the system SHALL use the calm light theme with no animation and show only the server `message` and a link to `helpUrl`.
3. WHEN the crisis screen is shown THEN the system SHALL not show steps, insights, questions, the save button or the diagnostic link.
4. WHEN the answer has `kind: "crisis"` THEN the system SHALL delete the saved draft from `localStorage`.
5. WHEN the crisis screen is shown THEN the system SHALL offer only a "Back to the start" button.

### Requirement 7: Save the ladder as an image

**User Story:** As a person, I want to save my haunted ladder as a picture, so that I can keep my steps or share them.

#### Acceptance Criteria

1. WHEN the person presses "Save my ladder" THEN the system SHALL download a PNG of the staircase with the goal, obstacles, ghosts and written steps.
2. WHEN the PNG is made THEN the system SHALL draw the faded state of every ghost that has a step.
3. WHEN the PNG is made THEN the system SHALL add the small line "Haunted Ladder, built on the Ladder method by Aizhan Li" at the bottom.
4. WHEN the PNG is made THEN the system SHALL make it fully in the browser and send nothing to any server.

### Requirement 8: Privacy, access and hosting

**User Story:** As a person, I want my words to stay mine, so that I can be honest.

#### Acceptance Criteria

1. WHEN the app runs THEN the system SHALL make no network request except the `analyze_ladder` call: no analytics, no cookies, no external fonts or scripts.
2. WHEN the app is used with a keyboard only THEN the system SHALL let the person complete every screen, with a visible focus ring.
3. WHEN the app is used with a screen reader THEN the system SHALL give each ghost and each step a text label with the person's phrase.
4. WHEN text is shown THEN the system SHALL meet WCAG AA contrast on its background.
5. WHEN code is pushed to `main` THEN the system SHALL be built and deployed to GitHub Pages at `/haunted-ladder/` by a GitHub Actions workflow.

### Requirement 9: The costume comes alive

**User Story:** As a person, I want the night around my ladder to react to what I write, so that the fear feels real at the start and I can feel it calm down step by step.

#### Acceptance Criteria

1. WHEN the result screen is shown THEN the system SHALL draw a glowing x-ray heart behind the staircase: a translucent cold grey-blue heart with a warm red-orange glow at its center. (Changed by Requirement 17: the heart is now a crisp heart in its own pulse panel above the staircase, not behind it.)
2. WHEN ghosts are drawn THEN the system SHALL make the heart beat at a rate that depends only on the number of ghosts without a step: 60 beats per minute when none are left, plus 12 beats per minute for each unfaded ghost, never above 120.
3. WHEN the last ghost gets a step THEN the system SHALL slow the heart to 60 beats per minute over about 3 seconds and soften its glow.
4. WHEN the request is in progress THEN the system SHALL cover the staircase with slow drifting fog, and WHEN the reading arrives THEN the fog SHALL lift and the moonlight SHALL reach the steps one by one from the bottom up.
5. WHEN the pointer or keyboard focus moves near a ghost that has no step THEN the ghost SHALL drift slightly away, and the cobwebs SHALL sway slowly at all times.
6. WHEN the app opens THEN the system SHALL play no sound. WHEN the person presses the "Night sound" button THEN the system SHALL start a quiet night wind and a heartbeat in time with the heart, fading in over 2 seconds; pressing it again SHALL fade the sound out.
7. WHEN the person turns the sound on or off THEN the system SHALL remember the choice in `localStorage`, but SHALL still wait for a press of the button after every page load before playing anything.
8. WHEN the crisis, health or error screen is shown THEN the system SHALL draw no heart and no fog and SHALL play no sound.
9. WHEN `prefers-reduced-motion: reduce` is set THEN the system SHALL show the heart still, with no beat, no fog drift and no swaying, and SHALL show the beat rate as text instead.
10. WHEN the heart, fog or sound are made THEN the system SHALL build them in the browser (inline SVG and the Web Audio API) and SHALL load no external file for them.

### Requirement 10: A demo link for judges and first-time visitors

**User Story:** As a judge or a first-time visitor, I want to see the haunted staircase in seconds without typing my own fears, so that I can understand the app before I decide to write my own ladder.

#### Acceptance Criteria

1. WHEN the page opens with `?demo=1` in the address THEN the system SHALL fill the form with the sample ladder from `tech.md` (one goal, one "I" phrase, 3 obstacles, 3 fears) and SHALL show the last form screen with the "Show my ladder" button, so one press sends the real request. (Changed by Requirement 16: the sample ladder is now sent at once, without the form screen.)
2. WHEN the demo ladder is shown THEN the system SHALL mark it with a short line "Sample ladder. Clear it to write your own." and a "Clear" button.
3. WHEN the demo ladder is loaded THEN the system SHALL NOT overwrite a draft already saved in `localStorage` and SHALL NOT save the demo answers.
4. WHEN the demo ladder is sent THEN the system SHALL call the same Ladder server and follow Requirements 2 to 9 exactly as for a person's own ladder; the client SHALL NOT use a canned or invented reading.

### Requirement 11: A haunted entrance and a costume that holds together

**User Story:** As a first-time visitor or a judge, I want the first screen to already feel like a haunted night and the result screen to read cleanly, so that I want to press Start and can read every step without effort.

#### Acceptance Criteria

1. WHEN the intro screen is shown THEN the system SHALL draw a night scene in inline SVG behind the text: a moon with a soft halo, a few stars, a ladder silhouette rising from low fog toward the moon, and one small ghost peeking from behind the ladder. It SHALL load no external file.
2. WHEN the intro screen is shown THEN the title "Haunted Ladder" SHALL glow softly with a slow candle flicker, and the system SHALL show a second button "See a sample ladder" next to "Start" that opens the same page with `?demo=1`.
3. WHEN the result screen is shown THEN every step label SHALL sit on its own solid step color, drawn above the heart (Changed by Requirement 17: labels now sit in solid note cards to the right of the staircase, and nothing is drawn behind them), so that step text keeps WCAG AA contrast (4.5:1) no matter what is behind it, and no ghost label SHALL overlap a ghost or another label.
4. WHEN ghosts without a step are drawn THEN each SHALL float gently up and down in a loop of 3 to 5 seconds with a different phase per ghost; a faded ghost SHALL stop floating.
5. WHEN `prefers-reduced-motion: reduce` is set THEN the flicker and the floating SHALL be off, and the scene SHALL be shown still.
6. WHEN the crisis, health or error screen is shown THEN the intro scene, the glow and the floating SHALL NOT appear (Requirement 6.1 still holds).
7. WHEN the page is 360 px wide THEN the intro scene, the staircase and the buttons SHALL fit without horizontal scrolling.

### Requirement 12: The ghost fades where you type, and every label reads on a phone

**User Story:** As a person writing my small steps, I want to see the ghost fade right next to the field I am typing in, and to read every step on my phone without zooming, so that the main moment of the app is not missed.

#### Acceptance Criteria

1. WHEN the result screen is at least 900 px wide THEN the staircase with the heart SHALL sit in a left column that stays in view (sticky) while the person scrolls, and the "Make the ghosts smaller" fields SHALL sit in the right column next to it, so the ghost fade is seen while typing.
2. WHEN the result screen is narrower than 900 px THEN the "Make the ghosts smaller" block SHALL come right after the staircase (before the sound toggle, the insights and the questions), and each step field SHALL show its own small ghost icon whose opacity follows that ghost (full without a step, 0.15 with a step), so the fade is seen next to the field.
3. WHEN the page is 375 px wide THEN every step label and every ghost label on the staircase SHALL render at 13 CSS px or larger, with wrapping that keeps all text inside its step or ghost slot and no overlap (Property 14 still holds).
4. WHEN the layout changes THEN Requirements 6.1, 11.5 and 11.7 SHALL still hold: no horizontal scroll at 360 px, reduced motion respected, calm screens unchanged.

### Requirement 13: Dawn when the last ghost fades

**User Story:** As a person who gave every fear a small step, I want the night to end, so that I feel the change and not only read about it.

#### Acceptance Criteria

1. WHEN the reading has at least one ghost and every ghost has a non-empty step THEN the result scene SHALL turn to dawn over about 4 seconds: the sky gradient moves from night to a soft rose and gold, the stars fade out, the moon sinks and a sun rises behind the top of the ladder, the fog thins, and a short line appears under the staircase: "Morning. Every fear has a next step."
2. WHEN a step is cleared after dawn THEN the night SHALL come back gently over about 2 seconds.
3. WHEN the reading has no ghosts THEN the system SHALL NOT show the dawn.
4. WHEN `prefers-reduced-motion: reduce` is set THEN the switch to dawn and back SHALL happen at once, without animation.
5. WHEN the dawn is shown THEN every step label and the dawn line SHALL keep WCAG AA contrast (4.5:1) on the dawn colors, and "Save my ladder" SHALL save the picture with the dawn.
6. WHEN the crisis, health or error screen is shown THEN no dawn element SHALL appear (Requirement 6.1 still holds).

### Requirement 14: A ghost dissolves into light

**User Story:** As a person typing a small step, I want the ghost to break into light and float up to the moon, so that the moment feels alive.

#### Acceptance Criteria

1. WHEN a ghost gets a step (from empty to non-empty) THEN the system SHALL draw 8 to 14 small light motes at the ghost that drift up toward the moon (or the sun at dawn) and fade out over 1.2 to 1.8 seconds, while the ghost itself fades to 0.15.
2. WHEN the motes finish THEN the system SHALL remove them from the DOM, so that adding and clearing steps many times leaves no motes behind.
3. WHEN "Night sound" is on THEN the dissolve SHALL play one soft short chime made with Web Audio (fade in and out, peak gain at most 0.15); WHEN the sound is off, no sound SHALL play.
4. WHEN `prefers-reduced-motion: reduce` is set THEN no motes SHALL be drawn and the ghost SHALL simply fade.

### Requirement 15: Russian and Kazakh

**User Story:** As a woman in Kazakhstan, I want to use the app in Russian or Kazakh, so that I can write my fears in my own language.

#### Acceptance Criteria

1. WHEN any screen except the calm screens is shown THEN the system SHALL show a language switch EN / RU / KZ; the first choice SHALL come from `navigator.language` (ru to RU, kk to KZ, anything else to EN), and the person's choice SHALL be saved in `localStorage` and SHALL update `<html lang>`.
2. WHEN the interface shows any text THEN it SHALL come from one dictionary per language (`en`, `ru`, `kk`) with exactly the same keys and no empty values.
3. WHEN the form shows the question titles and hints in Russian or Kazakh THEN they SHALL be the Ladder server's own texts from `get_ladder_questions`, copied into the dictionaries during development; the app SHALL NOT call `get_ladder_questions` at runtime (the only runtime call stays `analyze_ladder`).
4. WHEN the ladder is sent THEN `analyze_ladder` SHALL get the chosen language (`en`, `ru` or `kk`), so that the reading comes back in it.
5. WHEN the author is named THEN Russian SHALL say «автор методики «Лестница»» and Kazakh «Баспалдақ» әдістемесінің авторы; no language SHALL call her a psychologist or therapist (психолог, психотерапевт).
6. WHEN the demo ladder is sent THEN it SHALL use sample phrases written in the chosen language.

### Requirement 16: One click from the entrance to a real ladder

**User Story:** As a judge with two minutes, I want one click to take me from the entrance to a real haunted ladder, so that I see the main moment before I leave.

#### Acceptance Criteria

1. WHEN "See a sample ladder" is pressed on the intro, or the page opens with `?demo=1`, THEN the system SHALL send the sample ladder to the Ladder server at once and show the fog and then the result, without the form screens.
2. WHEN the sample result is shown THEN it SHALL say "Sample ladder" with a "Write my own" button that clears the sample and opens question 1.
3. WHEN the sample is shown THEN Requirements 10.3 and 10.4 SHALL still hold: no saved draft is overwritten, the demo answers are not saved, and the reading comes from the real server.

### Requirement 17: A staircase seen from the side, like the Ladder site, and a clear heart

**User Story:** As a person who knows the Ladder method from 108psy.com, I want the haunted staircase to look like the Ladder I know, a staircase seen from the side with numbered steps and my words next to them, and I want the heart to be sharp and easy to read, so that the picture feels finished and I understand it at a glance.

#### Acceptance Criteria

1. WHEN the result screen is shown THEN the system SHALL draw every step of the reading, fears included, as one numbered plate on a staircase seen from the side: the "I" step at the bottom left, then the obstacles from the nearest up, then the goal, then the fears above the goal, each plate one step to the right of and one row above the one before it, standing on a floor line, like the Ladder on 108psy.com.
2. WHEN the plates are drawn THEN each SHALL show its step number in the middle, the "I" step SHALL carry a small "me" badge and the goal step a small "goal" badge in its note card (texts in all three languages), and a thin banister SHALL run along the staircase with one short post on each plate.
3. WHEN a step has words THEN the system SHALL show them in a solid note card in one column to the right of the whole staircase, at the height of that step's plate, joined to the plate by a thin leader line with a dot at the plate end; no note card SHALL overlap another card or any plate.
4. WHEN the plates and cards are colored THEN the "I" plate SHALL be moonlight, obstacle plates dark with a small cobweb in one corner (the nearest obstacle outlined in pumpkin), the goal plate lit pumpkin with a lantern light above it, and fear plates dashed and empty while their ghost has no step and solid and moonlit once it has one; every number and every card text SHALL keep WCAG AA contrast (4.5:1) against its own solid fill.
5. WHEN a fear has no step THEN its ghost SHALL float inside that fear's note card, to the left of the words; WHEN the fear gets a step THEN the ghost SHALL fade to 0.15 with a pumpkin check mark, the words SHALL stay readable, and Requirements 5, 13 and 14 (fade, dawn, motes) SHALL still hold.
6. WHEN the heart is shown THEN the system SHALL draw it as a crisp vector heart, solid red to pumpkin with a light outline and no blur, in its own pulse panel above the staircase together with a moving pulse line (one beat spike per beat, in time with the heart) and the beat rate written as text; the heart SHALL NOT sit behind or over any text. Requirement 9.2, 9.3 and 9.9 still hold (under reduced motion the heart and the pulse line are still).
7. WHEN the staircase is drawn THEN it SHALL be drawn at 1 SVG unit = 1 CSS px for containers from 300 to 680 px wide (wider containers get the 680 px picture, the saved picture always uses 680 px), with note text at 13 px or larger, so Requirements 11.7 and 12 still hold at 360 and 375 px and in the two-column layout at 900 px and wider.
8. WHEN the staircase is drawn THEN the person's words SHALL still go in only as SVG text nodes (Property 10) and the full words of every step SHALL be in the plate's `<title>` even when the card text is cut with an ellipsis.

### Requirement 18: Kazakh night steppe art: the Zheztyrnaq turns into a Peri

**User Story:** As a judge from anywhere in the world, I want the haunted ladder to look like a Kazakh legend at night, with spirits and golden objects I can understand from a short legend, so that the costume is memorable and the meaning stays clear.

#### Acceptance Criteria

1. WHEN the result screen draws the staircase THEN the system SHALL put the night steppe picture `public/art/steppe-night.webp` (mountains, a yurt and Temir Qazyq in the sky) as the first child of the staircase SVG, an `<image class="backdrop">` that covers the whole picture (`preserveAspectRatio="xMidYMid slice"`), under every plate, card and ghost; every number and card text SHALL keep its solid fill and WCAG AA contrast (Requirement 17.4); WHEN dawn comes (Requirement 13) the backdrop SHALL let the dawn sky show through (for example a lower opacity) and Property 16 SHALL still hold.
2. WHEN a fear has no step THEN its ghost inside the fear card SHALL be the picture of the Zheztyrnaq (`art/zheztyrnaq.webp`), about 44 px tall, in the same place as today (to the left of the words, inside `GHOST_ROOM`); the `.ghost[data-ghost]`, `.ghost-float`, `.ghost-body` with `translate(x y)`, `.ghost-check` and `.ghost-label` elements SHALL stay, and the white SVG ghost shape SHALL be removed.
3. WHEN the fear gets a step THEN the ghost SHALL turn into the Peri (`art/peri.webp`, a bright golden spirit) at full strength: the Zheztyrnaq image opacity 0, the Peri image opacity 1, the pumpkin check shown, and the words readable; when motion is welcome the turn SHALL pass through `art/spirit-turning.webp` for about one second (a CSS animation, no JavaScript timers); WHEN the step is cleared THEN the Peri SHALL turn back into the Zheztyrnaq. This replaces the fade to 0.15 of Requirement 17.5 on the staircase only (Requirements 5.2 and 5.3 still hold: the ghost changes when a step is written and comes back when it is cleared); the small icons next to the step fields keep their 1 and 0.15 (Property 15).
4. WHEN a step that is not a fear has a note card THEN the card SHALL show one small golden emblem (about 24 px) to the left of the words, in the same room as the ghost: the "I" step `art/shanyraq.webp` (home and the start), the nearest obstacle `art/asyq.webp` (luck), every other obstacle `art/tumar.webp` (protection), the goal `art/burkit.webp` (freedom); the words SHALL start after the emblem room so nothing overlaps (Properties 14, 15 and 19 still hold at 375 px and 680 px).
5. WHEN the ghost step fields are shown ("Make the ghosts smaller") THEN their heading SHALL carry the golden `art/qobyz.webp` emblem: in the legend of Korkyt Ata, death could not come near while his qobyz played; here a small step plays that music.
6. WHEN the result screen is shown THEN under the staircase there SHALL be a short legend "Who lives on this ladder" that shows each of the seven pictures (about 48 px) with its Kazakh name and one sentence in the chosen language, with exactly these English texts (Russian and Kazakh in the task):
   - Zheztyrnaq: "Zheztyrnaq, the copper-clawed spirit of Kazakh legends. Here she is a fear without a step."
   - Peri: "Peri, a bright spirit of Turkic tales. A fear turns into her when you write one small step."
   - Shanyraq: "Shanyraq, the crown of the yurt: home and the place you start."
   - Asyq: "Asyq, the knucklebone of an old Kazakh game: luck for your nearest obstacle."
   - Tumar: "Tumar, a folk amulet: protection on the hard steps."
   - Qobyz: "Qobyz, the instrument of Korkyt Ata. In the legend, death could not come near while he played."
   - Burkit: "Burkit, the golden eagle: freedom at your goal."
7. WHEN any picture of this requirement is drawn THEN its address SHALL be built from `import.meta.env.BASE_URL` + `art/...` (no other host), it SHALL be decorative for screen readers (`aria-hidden="true"` or an empty `alt`), and the accessible names of plates, ghosts and cards SHALL stay the person's words (Requirement 8.3).
8. WHEN the picture is saved (Requirement 7) THEN every `<image>` in the saved SVG SHALL be inlined as a `data:` URL before it is drawn on the canvas, so the steppe, the spirits and the emblems are in the PNG; IF a picture cannot be loaded THEN it SHALL be left out and the save SHALL still work.
9. WHEN `prefers-reduced-motion: reduce` is set THEN the Zheztyrnaq SHALL not float and SHALL change to the Peri at once, with no turning animation (Requirement 9.9).
10. WHEN the crisis, health or error screen is shown THEN none of these pictures SHALL be shown there (safety steering).
