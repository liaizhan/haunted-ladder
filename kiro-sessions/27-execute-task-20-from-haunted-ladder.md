# Execute Task 20 From Haunted Ladder

- Source: Kiro IDE
- Agent: haunted-builder
- Started: 2026-11-14T05:09:15.475Z
- Tool calls: 29
- Credits: 4.47

## Hooks that fired

- postToolUse-0 (completed): 13
- Run tests on save (completed): 9
- Words check on save (completed): 8
- stop-0 (completed): 1

## Prompt

Execute task 20 from the spec .kiro/specs/haunted-ladder/tasks.md. First read requirements.md, design.md, tasks.md and all files in .kiro/steering, and look at the existing code in src/ and tests/. Do ONLY task 20 and its sub-tasks, including its property-based tests (fast-check, tagged with the property number from design.md). Write files only inside this folder. You cannot run shell commands: write code that passes 'npm test' (vitest run) and 'npm run build' (tsc --noEmit && vite build) under TypeScript strict with noUncheckedIndexedAccess. When done, mark task 20 and its sub-tasks as [x] in tasks.md. Finish with a short summary.

- steering: product.md, safety.md, structure.md, tech.md
## Kiro

I'll start by reading the spec files and the existing code.

- tool `list_directory`: List Directory {"path":".","explanation":"See project layout","depth":3}
- tool `list_directory`: List Directory {"path":"./.kiro","explanation":null,"depth":3}
- tool `list_directory`: List Directory {"path":"./src","explanation":null,"depth":3}
- tool `list_directory`: List Directory {"path":"./tests","explanation":null,"depth":3}
- tool `read_file`: Read File {"path":"./.kiro/hook-runs.log","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/main.ts","offset":null,"limit":null}
- tool `code`: Code Intelligence {"operation":"generate_codebase_overview","symbols":[],"path":"."}
- tool `read_file`: Read File {"path":"./src/ui/staircase.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/styles.css","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/ui/exportImage.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/ui/fog.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/ui/reading.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./tests/ui/accessibility.test.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/tasks.md","offset":95,"limit":30}
- tool `read_file`: Read File {"path":"./tests/ui/exportImage.test.ts","offset":null,"limit":null}
- tool `grep_search`: Grep Search {"query":"stage|firstElementChild|children\\.length|bg\\b|fill.*#14112B|NIGHT","includePattern":"tests/**/*.ts"}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/tasks.md","offset":125,"limit":25}
- tool `fs_write`: Write File {"path":"./src/ui/dawn.ts","text":"import { allFaded, type Ghost } from '../domain/ghosts';\n\n/** The line shown under  ...
- tool `str_replace`: Replace in File {"path":"./src/main.ts","oldStr":" stage.append(h.element, svg);\n const activeFog","newStr":" const dawn = buildDawn(); ...
- tool `str_replace`: Replace in File {"path":"./src/main.ts","oldStr":" h.update(gs);\n },","newStr":" h.update(gs);\n setDawn(stage, isDawn(gs));\n },","rep ...
- tool `str_replace`: Replace in File {"path":"./src/main.ts","oldStr":"import { saveLadderImage } from './ui/exportImage';","newStr":"import { saveLadderImag ...
- tool `str_replace`: Replace in File {"path":"./src/ui/exportImage.ts","oldStr":" const written = ghosts.filter(isFaded);\n const rows: { fear: string[]; ste ...
- tool `str_replace`: Replace in File {"path":"./src/ui/exportImage.ts","oldStr":"import { wrapText } from './staircase';","newStr":"import { wrapText } from  ...
- tool `str_replace`: Replace in File {"path":"./src/styles.css","oldStr":" --calm-text: #1d1d1f;\n","newStr":" --calm-text: #1d1d1f;\n --dawn-top: #f4b6a6;\n ...
- tool `fs_append`: Append to File {"path":"./src/styles.css","text":"\n/* Dawn: when every ghost has a step, the night ends */\n.dawn-sky {\n position: ab ...
- tool `fs_write`: Write File {"path":"./tests/ui/dawn.test.ts","text":"// @vitest-environment jsdom\nimport { describe, it, expect } from 'vitest';\n ...
- tool `fs_append`: Append to File {"path":"./tests/ui/accessibility.test.ts","text":"\n// ---- Task 20.3: dawn colors and motion (13.4, 13.5) ----\n\ndesc ...
- tool `str_replace`: Replace in File {"path":"./tests/ui/accessibility.test.ts","oldStr":"import { buildCalm } from '../../src/ui/calm';","newStr":"import {  ...
- tool `str_replace`: Replace in File {"path":"./.kiro/specs/haunted-ladder/tasks.md","oldStr":"- [ ] 20. Dawn when the last ghost fades\n - [ ] 20.1 Add `src ...
## Kiro

Task 20 is written and marked `[x]` in `tasks.md`, with its three sub-tasks. I couldn't run `npm test` or `npm run build`, so none of it has been run or type-checked.

**20.1, dawn module and wiring**
- New `src/ui/dawn.ts` has `isDawn`, `setDawn` and `buildDawn`. `isDawn` is true only when there is at least one ghost and every ghost has a step.
- `buildDawn` makes the sky layer (gradient, stars, sun) and the dawn line "Morning. Every fear has a next step."
- `main.ts` puts these in the result stage and calls `setDawn` on first render. The same `onStepsChange` path calls it again on every step change, so clearing a step brings the night back.

**20.2, CSS and saved picture**
- `styles.css` has new `--dawn-top`, `--dawn-bottom` and `--dawn-text` variables. The sky fades to rose and gold, the stars fade out, the moon sinks and the sun rises. The line is hidden until dawn.
- Transitions are 4 s in and 2 s out, and only inside the `prefers-reduced-motion: no-preference` block, so under reduced motion the change is instant.
- Calm screens hide the dawn elements and never create them.
- `exportImage.ts` draws the dawn when `isDawn` is true: sky gradient, a sun, no moon, the dawn line, and dark text for contrast. Without dawn the picture is unchanged.

**20.3, tests**
- `tests/ui/dawn.test.ts` covers Property 16:
  - `isDawn` against arbitrary steps, including whitespace-only ones.
  - The stage class staying equal to `isDawn` after any sequence of typing and clearing, with 0 to 5 ghosts.
  - The saved picture having the dawn only when every ghost has a step.
  - Calm screens having no dawn element.
- `accessibility.test.ts` now checks that the dawn text reaches AA contrast on both ends of the sky. It also checks that the hex colors in `dawn.ts` match the CSS variables, and that the 4 s and 2 s transitions sit only under `no-preference`.

Requirement 13.1 says the fog thins at dawn, and I didn't add anything for that. The fog element is already removed once the reading arrives.

