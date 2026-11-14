# AGENTS.md

Haunted Ladder: a one-page web app for the Kiroween 2026 hackathon. A person writes a goal, obstacles and fears; fears become Kazakh night spirits on a staircase and fade when the person writes one small step. Built on the Ladder method by Aizhan Li, author of the Ladder method.

Any coding agent (Kiro, Claude Code, Codex, Cursor) working here follows these rules. Kiro also loads the detailed rules in `.kiro/steering/`.

## Commands

- `npm install`, then `npm run dev` (http://localhost:5173/haunted-ladder/)
- `npm test`: Vitest, jsdom and fast-check, all tests must pass
- `npm run build`: type check and production build
- `npm run screens`: screenshots of every screen into `screens/` (needs Chrome, sends nothing to the network)
- `npm run check:locales`: the same keys in en, ru and kk
- `npm run export:sessions`: export this repo's Kiro chats to `kiro-sessions/`

## Hard rules

1. Safety first. On `kind: "crisis"` show only the server message, the help link and one button back. No staircase, ghosts, sound or decoration.
2. Never call Aizhan Li a psychologist or a therapist.
3. No prices and no subscription offers in the app.
4. User text only through `textContent` or SVG text nodes, never `innerHTML`.
5. The only network call is `analyze_ladder` on `https://108psy.com/mcp`. No analytics, no cookies, no external fonts or CDNs.
6. Every UI string lives in `src/locales/en.ts`, `ru.ts` and `kk.ts` with the same key.
7. Animations only under `prefers-reduced-motion: no-preference`. Sound only after the Night sound button.
8. Do not run `git push`. Publishing happens only after Aizhan Li says yes.

## Where things are

- `src/domain`: pure logic (draft, server answer, ghosts, storage). Property tests in `tests/domain`.
- `src/ui`: screens and pictures. `src/main.ts` wires the screens.
- `.kiro/specs/haunted-ladder`: requirements, design, tasks for the whole app.
- `.kiro/specs/english-legend-clarity`, `.kiro/specs/perseids-starfall`: smaller specs.
- `.kiro/agents`: `haunted-builder` writes code, `haunted-reviewer` only reads and reviews.
- `.kiro/workflows/release.workflow.json`: checks, screens, three language reviews, then a local commit only after the author's yes.
- `.kiro/skills/add-spirit`, `powers/ladder`: how to add a spirit, and the Ladder MCP as a Kiro power.
- `ARCHITECTURE.md`: diagrams of the app and of the Kiro setup.
