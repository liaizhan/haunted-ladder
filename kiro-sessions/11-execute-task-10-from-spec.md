# Execute Task 10 From Spec

- Source: Kiro IDE
- Agent: vibe
- Started: 2026-11-13T18:43:29.066Z
- Tool calls: 15
- Credits: 1.78

## Hooks that fired

- Run tests on save (completed): 2
- Words check on save (completed): 1

## Prompt

Execute task 10 from the spec .kiro/specs/haunted-ladder/tasks.md. First read requirements.md, design.md, tasks.md and all files in .kiro/steering, and look at the existing code in src/ and tests/. Do ONLY task 10 and its sub-tasks, including its property-based tests (fast-check, tagged with the property number from design.md). Write files only inside this folder. You cannot run shell commands: write code that passes 'npm test' (vitest run) and 'npm run build' (tsc --noEmit && vite build) under TypeScript strict with noUncheckedIndexedAccess. When done, mark task 10 and its sub-tasks as [x] in tasks.md. Finish with a short summary.

- steering: product.md, safety.md, structure.md, tech.md
- tool `list_directory`: List Directory {"path":"./.kiro","explanation":null,"depth":3}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/tasks.md","offset":null,"limit":null}
- tool `grep_search`: Grep Search {"query":"^#{1,3} .*|7\\.[1-4]|PNG|png","includePattern":".kiro/specs/haunted-ladder/{requirements,design}.md"}
- tool `list_directory`: List Directory {"path":"./.kiro/steering","explanation":null,"depth":null}
- tool `read_file`: Read File {"path":"./src/ui/reading.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/main.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/ui/staircase.ts","offset":null,"limit":80}
- tool `grep_search`: Grep Search {"query":"exportImage|Requirement 7|credit|haunted-ladder\\.png","includePattern":".kiro/specs/haunted-ladder/*.md"}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/requirements.md","offset":84,"limit":14}
- tool `grep_search`: Grep Search {"query":"Property \\d+|export function|viewBox","includePattern":"{.kiro/specs/haunted-ladder/design.md,src/ui/staircas ...
- tool `read_file`: Read File {"path":"./src/ui/staircase.ts","offset":80,"limit":null}
- tool `read_file`: Read File {"path":"./tests/ui/staircase.test.ts","offset":null,"limit":40}
- tool `fs_write`: Write File {"path":"./src/ui/exportImage.ts","text":"import { isFaded, type Ghost } from '../domain/ghosts';\nimport { wrapText } f ...
## Kiro

Add a small test, then mark the tasks.

- tool `fs_write`: Write File {"path":"./tests/ui/exportImage.test.ts","text":"// @vitest-environment jsdom\nimport { describe, it, expect } from 'vit ...
- tool `str_replace`: Replace in File {"path":"./.kiro/specs/haunted-ladder/tasks.md","oldStr":"- [ ] 10. Save as PNG\n - Serialize the SVG, draw on a canvas  ...
## Kiro

Task 10 is implemented in `src/ui/exportImage.ts`, and I marked task 10 and its two sub-items `[x]` in `tasks.md`. I couldn't run shell commands, so neither `npm test` nor `npm run build` has been run. I checked the types by reading the code only.

- **`buildExportSvg(svg, ghosts)`:** it copies the staircase SVG and leaves the original alone. The copy gets a night background and a list of each written step under the staircase. The credit line "Haunted Ladder, built on the Ladder method by Aizhan Li" goes at the bottom. Ghosts with a step stay faded in the copy. All person text goes in as SVG text nodes only.
- **`saveLadderImage(svg, ghosts)`:** it draws the copy on a canvas at 2x and downloads `haunted-ladder.png`, all in the browser. It never throws. On failure it returns `{ ok: false, message }`, where the message is the exported `SAVE_FAILED_MESSAGE`.
- **Test:** I added `tests/ui/exportImage.test.ts`. It checks the credit line, the written step text, the faded ghost, the background and that the original SVG is unchanged.

Task 10 has no correctness property in `design.md`, so I wrote no property-based test for it.

`main.ts` is still a stub, so nothing calls `saveLadderImage` yet. The screen wiring has to call it from `onSave` and show the message when it fails.

