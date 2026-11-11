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

1. WHEN the result screen is shown THEN the system SHALL draw a glowing x-ray heart behind the staircase: a translucent cold grey-blue heart with a warm red-orange glow at its center.
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

1. WHEN the page opens with `?demo=1` in the address THEN the system SHALL fill the form with the sample ladder from `tech.md` (one goal, one "I" phrase, 3 obstacles, 3 fears) and SHALL show the last form screen with the "Show my ladder" button, so one press sends the real request.
2. WHEN the demo ladder is shown THEN the system SHALL mark it with a short line "Sample ladder. Clear it to write your own." and a "Clear" button.
3. WHEN the demo ladder is loaded THEN the system SHALL NOT overwrite a draft already saved in `localStorage` and SHALL NOT save the demo answers.
4. WHEN the demo ladder is sent THEN the system SHALL call the same Ladder server and follow Requirements 2 to 9 exactly as for a person's own ladder; the client SHALL NOT use a canned or invented reading.
