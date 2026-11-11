---
inclusion: always
---

# Product: Haunted Ladder

Haunted Ladder is a small, spooky but gentle self-check built on the Ladder method by Aizhan Li, author of the Ladder method and solo founder of 108psy.com. It is our entry to the Kiroween 2026 hackathon (category Costume Contest, bonus Best Startup Project).

## The idea

Fears are vague, so they feel bigger than they are. In Haunted Ladder a fear becomes a ghost you can see, name and make fade.

A person writes:

- a measurable goal (the light at the top of the stairs);
- where they are now (the "I" point at the bottom);
- 3 to 5 obstacles: short things people said that the person believes, for example "Dad: nobody pays for courses";
- up to 5 fears: what scares them if the goal comes true.

The app draws a dark staircase. Obstacles hang on the stairs as cobwebs. Fears float above the goal as ghosts. The public Ladder server reads the ladder and returns the steps by zone, what the ladder shows and two reflection questions. For each ghost the person writes one small step they can take this week, and the ghost fades. The finished ladder can be saved as an image.

## Who it is for

Adults, mostly women, who feel stuck on the way to a goal. Many are already anxious. The spooky look is a costume, never a threat.

## Rules that never change

- We never diagnose and never promise a health or life result. The app is a tool for self-reflection, not therapy.
- Aizhan Li is called "author of the Ladder method". Never call her a psychologist or a therapist.
- Quote the person's words exactly. Do not rewrite, judge or "improve" their phrases.
- Safety first: if the server answers `kind: "crisis"`, show only its message and the help link. No staircase, no ghosts, no Halloween decoration. See `safety.md`.
- Nothing is sent anywhere except the Ladder server call. No analytics, no cookies, no accounts. The only storage is `localStorage` in the person's own browser, and the person can clear it.
- No prices, no subscription offers inside the app. One quiet link to the free full diagnostic on 108psy.com is allowed after the reading.

## Pre-existing work

The Ladder MCP server at `https://108psy.com/mcp` was built before the hackathon for 108psy.com and the Ladder plugin in ChatGPT. Everything in this repository is new and built during the Kiroween submission period. The README must say this.
