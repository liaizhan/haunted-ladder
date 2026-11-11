---
inclusion: always
---

# Tech

- Vite + TypeScript (strict), plain DOM, no UI framework. Keep the bundle small.
- Tests: Vitest with jsdom, and fast-check for property-based tests. `npm test` runs everything once (`vitest run`).
- No backend, no database. The only network call is a JSON-RPC 2.0 POST to `https://108psy.com/mcp` (method `tools/call`, tool `analyze_ladder`). The server allows CORS from any origin and stores nothing.
- Hosting: GitHub Pages, deployed by a GitHub Actions workflow on push to `main`. Vite `base` is `/haunted-ladder/`.
- Graphics: inline SVG built in code. Export to PNG by drawing the SVG on a canvas. No image libraries.
- No external fonts or CDNs at runtime. Use a system font stack.
- Render user text only with `textContent` or SVG text nodes, never with `innerHTML`.
- Respect `prefers-reduced-motion`: no fade or float animation when it is set, the end state appears at once.

## The Ladder server contract

Request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "analyze_ladder",
    "arguments": {
      "language": "en",
      "goal": "Launch my online course by March",
      "me": "I have the lessons outlined but nothing recorded",
      "blocks": ["Dad: nobody pays for courses", "Friend: the market is full", "Teacher: you are not an expert"],
      "fears": ["People will laugh at my videos"]
    }
  }
}
```

Limits: every phrase 1 to 300 characters, `blocks` 3 to 5 items, `fears` 0 to 5 items, `language` is `en` in this app.

The answer is in `result.structuredContent` (the same JSON is also in `result.content[0].text`). `kind` is one of:

- `reading`: `steps` (from the bottom up, each with `number`, `zone` = `current | block | goal | fear`, `zoneLabel`, `text`), `nearestBlock`, `fearsAboveGoal`, `insights` (strings), `questions` (two strings), `fullDiagnostic` (`text`, `url`), `author`, `disclaimer`.
- `crisis`: `message` and `helpUrl`. Show only these.
- `health`: `message` and `helpUrl: null`. The words contain health details the server does not analyze. Show the message and let the person edit their answers.

A JSON-RPC `error` object or a network failure is an error state with a retry button. Never invent a reading on the client.

The `fullDiagnostic.url` comes with `utm_source=chatgpt_plugin`. Replace that value with `haunted_ladder` before showing the link.
