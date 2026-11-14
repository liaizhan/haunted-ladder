---
name: "ladder"
displayName: "Ladder of Fears"
description: "Turn a goal and the fears behind it into a ladder of small steps, with the Ladder method server (get_ladder_questions, analyze_ladder)."
keywords: ["ladder", "fears", "goal", "steps", "self-reflection", "mcp", "haunted-ladder"]
author: "Aizhan Li, author of the Ladder method"
---

# Ladder of Fears

This power connects Kiro to the public server of the Ladder method. The server asks four questions and turns the answers into a ladder: where the person stands now (the "I" point), what holds them back, what they fear, and the goal at the top.

Haunted Ladder, the Kiroween 2026 project, is built on this server. Every fear on the ladder becomes a spirit from Kazakh legends.

## Tools

- `get_ladder_questions`: the four questions and the hints for each, in English, Russian or Kazakh.
- `analyze_ladder`: takes the goal, the "I" point, obstacles and fears, and returns the ladder as numbered steps. It can also return a calm message instead of a ladder when the answers are about health or a crisis.

## When to use

- You build an app or a bot on top of the Ladder method and need real readings.
- You want a test fixture: call `analyze_ladder` once and save the answer.
- You check how a new language or a new question hint reads.

## Rules

- The reading is self-reflection. It is not treatment and promises no health result.
- If the answer has `kind: "crisis"`, show the message and the help link as they are. Do not add steps or advice.
- The author is "author of the Ladder method", never a psychologist.
- Send only what the person typed. Do not add names, emails or other personal data.

## Steering

- `steering/reading-guide.md`: how to show a reading and what each zone means.
