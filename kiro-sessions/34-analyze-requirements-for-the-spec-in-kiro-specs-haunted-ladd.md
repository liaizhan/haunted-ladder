# Analyze Requirements for the spec in .kiro/specs/haunted-ladder/requirements.md. Read requirements.md, design.md and tasks.md and the code in src. ...

- Source: kiro-cli
- Agent: kiro-cli
- Started: 2026-11-14T17:46:12.423537Z
- Tool calls: 8

## Prompt

Analyze Requirements for the spec in .kiro/specs/haunted-ladder/requirements.md. Read requirements.md, design.md and tasks.md and the code in src. Report in Markdown: (1) ambiguous or untestable acceptance criteria, (2) conflicts between requirements, (3) requirements with no task or no test, (4) gaps (edge cases not covered). For each finding give the requirement number, a one-line problem and a one-line suggested fix. Do not edit any file. Output only the Markdown report, starting with the heading '# Requirements analysis'.

- tool `read`: {"operations":[{"mode":"Directory","path":"./.kiro/specs/haunted-ladder"},{"mode":"Directory","path":"./src","depth":3}, ...
- tool `read`: {"operations":[{"mode":"Line","path":"./.kiro/specs/haunted-ladder/requirements.md"},{"mode":"Line","path":"./.kiro/spec ...
- tool `read`: {"operations":[{"mode":"Line","path":"./src/domain/ladder.ts"},{"mode":"Line","path":"./src/domain/storage.ts"},{"mode": ...
- tool `shell`: {"command":"cd . && for p in \"createForm\" \"createIntro\" \"buildFog|attachGhostDrift\" \"loadSettings|saveSettings\"  ...
- tool `grep`: {"pattern":"createForm|createIntro|buildFog|attachGhostDrift|loadSettings|buildLegend|navigator\\.language|initLang|rewr ...
- tool `grep`: {"pattern":"blood|innerHTML|maxLength|maxlength|Haunted Ladder, built|diagnostic|fullDiagnostic|href","path":"./src","in ...
- tool `grep`: {"pattern":"w-meteor|w-step|@media \\(prefers-reduced-motion","path":"./src/styles.css","max_total_lines":40}
- tool `glob`: {"pattern":".kiro/hooks/*","path":"."}
## Kiro

# Requirements analysis

Scope: `requirements.md` (19 requirements), `design.md`, `tasks.md`, and the code in `src` and `tests`. No file was edited. I could not run the tests (shell access was denied), so "no test" means I found no test file or match for it in `tests/`.

## 1. Ambiguous or untestable acceptance criteria

| Req | Problem | Suggested fix |
|---|---|---|
| 1.2 | "One idea per screen" does not say how many screens or which fields go on each. | List the screens (goal, "I" point, obstacles, fears) or drop the phrase. |
| 1.3 | "A short hint" has no wording, placement or timing. | Say when the hint appears (on blur or on input) and which locale key it uses. |
| 1.5 | "Not add the field" could mean a disabled button or a hidden one. | Say which: the "Add" control is disabled and a note says "5 is the limit". |
| 2.2 | "Calm waiting state" is vague. The waiting screen in `main.ts` runs 40 meteors, fog and a starfall, which no requirement describes. | Add a "waiting screen" requirement (content, motion, reduced motion). |
| 3.1 | "In the order the server sent" and "I lowest, goal at top" can disagree if the server's order differs. | Define the order as server order, and state what happens if `current` or `goal` is missing. |
| 4.3 | "WHEN the reading shows the diagnostic link" does not say whether the link always shows. | Say the link always shows after the reading. |
| 5.4 | "A short closing line" has no text. | Give the line, or point to its locale key. |
| 7.1 | "Written steps" in the PNG is unclear now that words sit in cards under the scene (Req 19.3). | Say where the steps appear in the saved picture. |
| 8.4 | "Text meets WCAG AA" for all text is too broad. Tests check only chosen color pairs. | List the pairs covered, or reference the accessibility test. |
| 9.2 / 9.3 | 9.2 says the rate "depends only on" the unfaded count. 9.3 adds a 3 s ease, which makes the rate depend on time. | Say 9.2 is the target rate and 9.3 is the transition. |
| 9.4, 9.5, 9.6 | "Slow drifting", "slightly away", "quiet" and "moonlight reaches the steps one by one" have no measurable values. | Give durations, distances or gain limits. 14.3 already does this for the chime. |
| 9.7 | The remembered sound choice has no effect, because sound always waits for a press. | Say what the saved choice changes, for example the initial `aria-pressed` label, or drop it. |
| 10.1 / 15.6 | "Sample ladder from `tech.md`" is ambiguous. `tech.md` has one fear. The requirement and the tasks say three. Phrases also depend on language. | Move the sample into the requirement, or into `demo.ts` as the source of truth. |
| 11.3, 11.4, 13.1, 14.1 | Durations ("about 4 seconds", "3 to 5 seconds") cannot be checked in jsdom. | Test the CSS values, or mark these criteria as manual. |
| 12.1 / 19.6 | "Sticky" (≥900 px) and "scrolls with the page" ("on a phone") give no breakpoint. The staircase is now taller than the screen. | State the breakpoint for each, and say whether sticky still applies when the stage is taller than the viewport. |
| 15.1 | "Anything else to EN" does not say how region tags are handled (`ru-RU`, `kk-KZ`). | Say it matches the language prefix. |
| 15.3 | "Copied from `get_ladder_questions`" cannot be verified by a test. | Mark it as a manual or review check. |
| 17.x (3 of 4 changed by 19) | 17.1 to 17.5 are marked as changed by 19, but their original text stays. A reader cannot tell which parts are still in force. | Rewrite 17 and 18 to the final design, or move the old text to an appendix. |
| 18.6 | "Russian and Kazakh in the task" makes the requirement depend on `tasks.md`. | Put the RU and KK texts in the requirement, or point to the locale keys. |
| 19.6 | "On a phone" is not a measurable condition. | Use a width, for example below 600 px. |

## 2. Conflicts between requirements and with steering

| Req | Problem | Suggested fix |
|---|---|---|
| 1.3 vs 1.2 | 1.3 disables "Next" for any empty field, but fears are optional (0 to 5). `validateDraft` also accepts a whitespace-only fear, which contradicts 1.3. | Exclude fear rows from 1.3, or require fears to be non-empty once added. |
| 2.1 vs 15.4 | 2.1 says `language: "en"`. 15.4 says the chosen language. Property 2 also still says `"en"`. | Change 2.1 and Property 2 to "the chosen language". |
| 6.2 / 6.5 vs 2.6 | 6.2 says "show only message and link" but 6.5 adds a button. The error screen shows two buttons. | Say "only the message, the link and one button" for crisis. Say the error screen follows 2.6. |
| 6.4 vs 10.3 | A crisis answer clears `localStorage`, even in demo mode where "no saved draft is touched". `showCalm` clears unconditionally. | In demo, either skip the clear or state that crisis always wins. |
| 10.3 vs 16.2 | After "Write my own" the draft is empty. The first keystroke makes `persist()` overwrite the draft that was saved before the demo. | Load the saved draft after "Write my own", or warn that the old draft is replaced. |
| 10.1 / 11.3 / 9.1 / 14.1 / 17.5 / 5.2 / 7.2 | Superseded text is still in the document: heart "behind" the staircase, fade to 0.15, labels "above the heart", "no ghost label overlaps a ghost". The criteria now point at behavior that no longer exists. | Delete the dead text, since 16, 17, 18 and 19 now define the behavior. |
| 13.1 vs 19.5 | 13.1 says "the moon sinks". 19.5 says the moon fades away. | Align the two wordings. |
| 19.1 vs `safety.md` | 19.1 requires a "blood moon". The code draws "dried blood" blotches (`staircase.ts:436`, `449`). `safety.md` says "no blood, skulls, gore". | Rename it (for example "red moon") and drop the blotches. Update the safety rule if it is a deliberate exception. |
| 9.5 vs `safety.md` | Ghosts that drift away from the pointer may read as "chasing". The safety rule allows only slow float. | Say the drift is at most N px and never toward the pointer. |
| 3.2 vs 17.8 | 3.2 says the phrase is shown "exactly as written". 17.8 allows an ellipsis cut. `product.md` says to quote exactly. | Allow up to 300 characters in the card (wrap fully), or add a full-text expander. |
| Docs vs README | The README says 10 requirements, 13 properties and 17 tasks. The spec has 19, 21 and 27. | Update the README counts, or generate them. |
| Tasks vs design | Task 24.3 names Property 19 "side staircase". The design's Property 19 text is the night scene, and the layout section is still the side view. Properties are numbered out of order (20 before 18). | Update the design section and the property list, and renumber. |

## 3. Requirements with no task or no test

| Req | Problem | Suggested fix |
|---|---|---|
| 19.1 to 19.4 | Task 27 sub-tasks (27.1 to 27.3) have no `_Requirements:_` lines. Only 27.4 cites them. | Add the requirement references to each sub-task. |
| 8.5 | Task 16 is done, but the README task 26 (which holds the deploy and live link) is unchecked and cites 8.5 only loosely. No test covers the workflow. | Finish task 26. Add a workflow lint or a manual-check note. |
| Task 26 | Task 26 is open and has no `Validates` line. The README's "live link added after first deploy" has no owner. | Add the requirement it covers and a checklist item for the live link. |
| 1.1, 1.2, 1.3, 1.5, 1.7 | `tests/` has no form or intro test (no match for `createForm` or `createIntro`). Only Properties 1 to 3 cover the validation logic, and `app.test.ts` walks the screens. | Add DOM tests for hints, the 5-item limit and "Clear my answers". |
| 9.4, 9.5 | There is no test for `fog.ts`: no match for `buildFog` or `attachGhostDrift` in `tests/`. | Add tests for lift order, drift and reduced motion. |
| 9.7 | There is no `settings.test.ts`. Property 12 is covered only through `nightSound.test.ts`. | Add a round-trip and broken-JSON test for `loadSettings`. |
| 15.1 | No test for the `navigator.language` mapping or `<html lang>`. `i18n.test.ts` may cover it, but I found no `navigator.language` match. | Add a mapping test for `ru`, `kk`, `ru-RU`, `de`. |
| 18.6 | The legend is built by `buildLegend`, which no test references. | Add a test for seven items and the three-language texts. |
| 7.1 to 7.4 | `exportImage.test.ts` is small (1.9 KB). The credit line, the dawn variant and the "could not save" message are not clearly covered. The credit line is English only (`creditLine`). | Test the credit line in all languages, the dawn export and the failure path. |
| 8.2, 8.3 | The keyboard-only claim is tested in jsdom only. Real focus rings and screen-reader names are not checked. | Mark as manual, as `design.md` already lists a manual pass. |
| 13.1, 11.4, 14.1 | Timing criteria have no test. Property 16 covers only the class. | See section 1. |

## 4. Gaps (edge cases not covered)

| Req | Problem | Suggested fix |
|---|---|---|
| 6 / 1.6 | The draft is saved on every keystroke, so crisis wording sits in `localStorage` until the server answers. The person can close the tab while waiting, and it stays. | Say what happens to drafts on an unfinished request, or save only after a valid submit. |
| 2.6 / 6 | The error and timeout screens show no help link. A person in crisis during a server outage gets no help. | Add a static help line to the error screen, or state why it is omitted. |
| 2.6 | The request sends `Accept: ... text/event-stream`, but the client calls `res.json()`. An SSE reply becomes a `shape` error. | Handle SSE, or drop the header. |
| 2.7 | Nothing says what happens when a late answer arrives after the timeout, or when a retry races an earlier call. | Say a stale answer is ignored. |
| 3.1 | `parseReading` accepts zero steps, or steps with no `goal` or `current`. | Require at least one `current` and one `goal` step, or define how the staircase renders without them. |
| 3.x | Nothing handles server text that differs from the person's phrase, or a block count outside 3 to 5. | Say the server's `text` is rendered as sent, and cap the step count. |
| 4.2 | `nearestBlock` is matched by text. Two identical obstacles would both highlight. | Match by step number or index. |
| 5.5 | Steps are stored keyed by the fear's text (`stepsRecord`). Two equal fears share one step, and editing a fear loses its step. | Key by fear index, and say what happens when the fear text changes. |
| 5.1 | The step field has no length limit. Storage and card layout are unbounded. | Add a 300-character limit like the other phrases. |
| 5.4 | The criterion does not say whether "Save my ladder" is enabled when there are no ghosts. `allFaded([])` is true, so it is enabled. | State this explicitly. |
| 15.1 | The switch also shows on the waiting screen. Changing language there redraws the waiting screen but does not resend, so the answer comes back in the old language. | Block the switch while waiting, or resend. |
| 15.4 | Changing language on a result screen for a person's own ladder re-renders with the old reading. The text mixes languages. | Resend the request (as the demo does), or lock the switch on the result. |
| 17.7 | Containers narrower than 300 px (some 320 px phones after padding) are clamped to 300 px and may scroll horizontally. 11.7 tests only 360 px. | Test 320 px, or allow a smaller minimum. |
| 18.10 | The waiting screen uses the steppe art and golden steps (`renderWaiting`). It is outside 2.2, 11.6 and 18.10. Its reduced-motion rule and its "no spooky elements" status are unspecified. | Add it to the reduced-motion criteria (9.9, 11.5) and decide whether it is allowed to keep decoration. |
| 18.8 | If an image fails to load it is left out. The criterion does not say whether the person is told. | State whether a note shows. |
| 9.6 | There is no rule for what happens when `AudioContext` is unavailable or blocked. | Say the button is hidden or disabled with a note. |
| 8.1 | The criterion says "no network request except `analyze_ladder`", but the app also loads same-origin art and may follow `helpUrl` and diagnostic links. | Say "no cross-origin request except `analyze_ladder`; links are navigation only". |
| 4.3 | `rewriteUtm` only rewrites an existing `utm_source`. If the server omits it, no source is added. The diagnostic link is not scheme-checked like `calm.ts` does for `helpUrl`. | Apply the same `safeHref` check to the diagnostic link. |
| 1.6 | Nothing says what happens if `localStorage` holds a draft that fails validation or has the old key version. | Say a broken or old-version draft is ignored and the intro shows. |

