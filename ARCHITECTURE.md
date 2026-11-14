# Architecture

Haunted Ladder is a static one-page app (Vite, TypeScript, no framework). The only network call is `analyze_ladder` on the Ladder MCP server. Everything else runs in the browser.

## The app

```mermaid
flowchart LR
  intro["Intro<br/>src/ui/intro.ts"] --> form["Form: goal, obstacles, fears<br/>src/ui/form.ts"]
  form -->|validateDraft| waiting["Waiting<br/>heart and fog"]
  waiting -->|analyze| client["ladderClient.ts<br/>POST https://108psy.com/mcp"]
  client -->|parseAnswer| answer{"kind"}
  answer -->|reading or health| result["Reading<br/>staircase, spirits, legend"]
  answer -->|crisis| calm["Calm screen<br/>server message, help link, one button"]
  result -->|one small step| fade["Spirit fades<br/>motes, dawn"]
  result --> image["Save as image<br/>exportImage.ts"]
  result <--> storage[("localStorage<br/>haunted-ladder:v1")]
```

- `src/domain`: pure logic with property tests in `tests/domain` (draft rules, server answer parsing, spirits from fears, saved steps).
- `src/ui`: screens and SVG pictures. User text goes only through `textContent` or SVG text nodes.
- `src/locales`: every string in English, Russian and Kazakh with the same keys.
- Crisis answers skip the staircase, spirits, sound and decoration on purpose.

## How Kiro builds it

```mermaid
flowchart TB
  subgraph rules["Rules"]
    steering[".kiro/steering<br/>product, tech, structure, safety,<br/>style, kazakh-folklore, devpost-writeup"]
    agentsmd["AGENTS.md"]
  end
  subgraph specs[".kiro/specs"]
    main["haunted-ladder<br/>requirements, design, 27 tasks"]
    bug["english-legend-clarity<br/>bugfix spec"]
    quick["perseids-starfall<br/>quick spec"]
  end
  subgraph agentsBox[".kiro/agents"]
    builder["haunted-builder<br/>writes code, calls Ladder MCP"]
    reviewer["haunted-reviewer<br/>read only"]
  end
  subgraph hooks[".kiro/hooks"]
    onsave["on save: tests, banned words,<br/>locale keys"]
    guard["before shell: block git push"]
    prompt["on prompt: project rules"]
    stop["on stop: screens reminder"]
  end
  subgraph tools["MCP, Power, Skill"]
    ladder["Ladder MCP<br/>get_ladder_questions, analyze_ladder"]
    pw["Playwright MCP<br/>browser checks"]
    power["powers/ladder<br/>Ladder of Fears power"]
    skill[".kiro/skills/add-spirit"]
  end
  release[".kiro/workflows/release<br/>checks, screens, 3 language reviews,<br/>author's yes, local commit"]

  rules --> builder
  specs --> builder
  builder --> hooks
  builder --> ladder
  reviewer --> release
  builder --> release
  release -->|author says yes| commit["git commit<br/>push stays with the author"]
```

- Every Kiro chat that built the app is exported to `kiro-sessions/` by `npm run export:sessions`.
- Hook runs are logged locally to `.kiro/hook-runs.log`.
