---
inclusion: always
---

# Safety

The people using this app may be anxious. The Halloween costume must never make that worse.

## Crisis answer

When `analyze_ladder` returns `kind: "crisis"`:

- Remove the staircase, the ghosts, the cobwebs, the moon and every Halloween element from the screen.
- Use the calm, plain theme: light background, dark text, no animation.
- Show the server `message` exactly as sent and a clear link to `helpUrl`.
- Do not show steps, insights, questions, the save button or the diagnostic link.
- Do not store the answers in `localStorage`. Clear any saved draft.
- Offer only one button: "Back to the start".

## Health answer

When the server returns `kind: "health"`, show its `message` in the calm theme and let the person go back and edit their answers. Do not draw ghosts for that attempt.

## Tone and look

- No jump scares and no sudden sounds. Sound plays only after the person presses "Night sound", always fades in and out, stays quiet, and never starts by itself after a page load. The crisis, health and error screens have no heart, no fog and no sound, no blood, skulls, gore or screaming faces.
- Ghosts are soft, round and slightly translucent. They float slowly and fade when a step is written. They never chase the cursor or pop up.
- Copy is warm and short. We never say a fear is silly or wrong. We say a fear becomes smaller when it has a name and a next step.
- Always show the server `disclaimer` under the reading.
- Never diagnose, never promise results, never call Aizhan Li a psychologist.
