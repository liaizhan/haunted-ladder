# Execute Task 13 From Spec

- Source: Kiro IDE
- Agent: vibe
- Started: 2026-11-13T18:48:09.062Z
- Tool calls: 14
- Credits: 1.77

## Hooks that fired

- Run tests on save (completed): 1
- Words check on save (completed): 2

## Prompt

Execute task 13 from the spec .kiro/specs/haunted-ladder/tasks.md. First read requirements.md, design.md, tasks.md and all files in .kiro/steering, and look at the existing code in src/ and tests/. Do ONLY task 13 and its sub-tasks, including its property-based tests (fast-check, tagged with the property number from design.md). Write files only inside this folder. You cannot run shell commands: write code that passes 'npm test' (vitest run) and 'npm run build' (tsc --noEmit && vite build) under TypeScript strict with noUncheckedIndexedAccess. When done, mark task 13 and its sub-tasks as [x] in tasks.md. Finish with a short summary.

- steering: product.md, safety.md, structure.md, tech.md
- tool `list_directory`: List Directory {"path":"./.kiro","explanation":null,"depth":3}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/tasks.md","offset":null,"limit":null}
- tool `execute_bash`: Run Command {"command":"cd .; ls .kiro/specs/* .kiro/steering; cat src/main.ts src/ui/heart.ts src/ui/staircase.ts; grep -n \"9\\.[0 ...
- tool `read_file`: Read File {"path":"./src/main.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/ui/staircase.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/ui/heart.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/requirements.md","offset":null,"limit":null}
- tool `list_directory`: List Directory {"path":"./.kiro/steering","explanation":null,"depth":null}
- tool `grep_search`: Grep Search {"query":"fog|sway|drift|ghost-float|reduced|lit|--beat","includePattern":"**/{styles.css,design.md}"}
- tool `read_file`: Read File {"path":"./src/styles.css","offset":170,"limit":200}
- tool `read_file`: Read File {"path":"./src/domain/ghosts.ts","offset":null,"limit":null}
- tool `fs_write`: Write File {"path":"./src/ui/fog.ts","text":"const NS = 'http://www.w3.org/2000/svg';\nconst LIFT_MS = 1500;\nconst STEP_DELAY_MS = ...
- tool `str_replace`: Replace in File {"path":"./src/styles.css","oldStr":"body.calm .heart {\n display: none;\n}","newStr":"body.calm .heart {\n display: non ...
- tool `str_replace`: Replace in File {"path":"./.kiro/specs/haunted-ladder/tasks.md","oldStr":"- [ ] 13. Fog, moonlight and living details\n - Fog while wait ...
## Kiro

I did task 13 and marked it and its three sub-tasks `[x]` in `tasks.md`. Nothing has been run. The shell command I tried was refused, so `npm test` and `npm run build` are unchecked.

- **`src/ui/fog.ts`** (new): `buildFog()` makes two blurred, hidden-from-screen-reader fog layers that drift. Its `lift(staircase)` fades the fog out over 1.5 seconds. It also adds a `lit` class to each `.stair`, 150 ms apart from the bottom up. `dimForWaiting(staircase)` dims the steps while the request is in progress. `attachGhostDrift(staircase)` moves an unfaded ghost up to 12 px away from the pointer. Its `focusGhost(index)` nudges the focused ghost up by 12 px. Faded ghosts stay still. `driftOffset()` is the pure distance maths behind the drift.
- **`src/styles.css`**: fog drift (24 s and 30 s), the step light-up transition, cobweb sway (7 s, ±2°) and the ghost drift transition. Under `prefers-reduced-motion` the fog drift, the sway and the step delay are all off, and the fog and `lift()` do nothing visible. `body.calm` hides the fog.

Nothing calls the new functions yet, because `src/main.ts` is still a stub. The screen wiring still has to call `buildFog`, `dimForWaiting`, `lift` and `attachGhostDrift`. It also has to call `focusGhost` from the step fields' focus and blur events. The spec has no property test for task 13, so I added no tests.

