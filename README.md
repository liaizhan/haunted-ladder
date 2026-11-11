# Haunted Ladder

Your fears are ghosts on the stairs to your goal.

Haunted Ladder is a spooky but gentle self-check built on the Ladder method by Aizhan Li, author of the Ladder method. You write a goal, where you are now, 3 to 5 obstacles and up to 5 fears. The app draws a night staircase: obstacles hang on the stairs as cobwebs, fears float above the goal as ghosts. For each ghost you write one small step for this week, and the ghost fades. You can save the finished ladder as a picture.

Entry to **Kiroween 2026**, category Costume Contest. Built with [Kiro](https://kiro.dev).

## Summary for judges

- **What:** a Halloween costume for a real self-check. Fears become ghosts, a glowing x-ray heart beats faster for every ghost without a step and calms down as each one fades.
- **Who it is for:** people who feel stuck between where they are and a goal. The same Ladder method already runs on [108psy.com](https://108psy.com) and in the Ladder plugin in ChatGPT.
- **Try it in one click:** the live app with `?demo=1` loads a sample ladder, so you can see the staircase without typing your own fears. (Live link is added after the first deploy.)
- **Safety is the spine:** a crisis answer from the server removes the whole costume, including the heart, fog and sound.

## Safety

The costume never comes before the person. If the Ladder server detects a crisis in the words, the app removes every Halloween element, stops all sound at once and shows only a calm message and a link to help. No jump scares. Sound is off on every page load and starts only after a press on "Night sound", with a slow fade. The app does not diagnose and does not promise any health or life result.

## Privacy

No backend, no accounts, no analytics, no cookies. Your draft lives only in your browser's `localStorage`, and "Clear my answers" removes it. The only network request is the reading from the Ladder server.

## How it was built with Kiro

- `.kiro/specs/haunted-ladder/`: 10 requirements in EARS form, a design with 13 correctness properties tested with fast-check, and a plan of 17 tasks Kiro works through.
- `.kiro/steering/`: product, tech, structure, safety and style rules Kiro follows on every task.
- `.kiro/hooks/`: three hooks. Tests run on every save; a plain words check on every save blocks forbidden wording, `innerHTML` and autoplay; an agent hook checks each finished task against the safety and style rules.
- `.kiro/settings/mcp.json`: the Ladder MCP server connected to Kiro, so the agent can call `analyze_ladder` while building.

## Pre-existing work (disclosure)

The Ladder MCP server at `https://108psy.com/mcp` (tools `analyze_ladder` and `get_ladder_questions`) and the Ladder method itself existed before the hackathon. They power 108psy.com and the Ladder plugin in ChatGPT. Haunted Ladder only calls this public server. Everything in this repository (spec, steering, hooks, app code, tests, graphics) was created during the Kiroween 2026 submission period.

## Run locally

```bash
npm install
npm run dev
npm test
```

## License

MIT, see [LICENSE](LICENSE).
