# How to show a ladder reading

1. Ask the four questions from `get_ladder_questions` in their order: goal, "I" point, obstacles, fears. One question per screen reads best.
2. Send the answers to `analyze_ladder` in the person's language (`en`, `ru` or `kk`).
3. The answer has `kind`:
   - `reading`: show `steps` from the lowest to the highest. Zone `current` is the "I" point at the bottom, `goal` is at the top, `block` and `fear` are in between.
   - `health`: show the message only. Offer to go back to the goal.
   - `crisis`: show the message and `helpUrl` only. No steps, no jokes, no animation.
4. Keep the person's own words in the steps. Do not rewrite them.
5. A step is done when the person writes one small action for it. Do not mark it done for them.
