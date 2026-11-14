# Execute Task 4 From Haunted Ladder Spec

- Source: Kiro IDE
- Agent: vibe
- Started: 2026-11-13T18:36:29.942Z
- Tool calls: 13
- Credits: 1.15

## Hooks that fired

- Run tests on save (completed): 4
- Words check on save (completed): 2

## Prompt

Execute task 4 from the spec .kiro/specs/haunted-ladder/tasks.md. First read requirements.md, design.md, tasks.md and all files in .kiro/steering, and look at the existing code in src/ and tests/. Do ONLY task 4 and its sub-tasks, including its property-based tests (fast-check, tagged with the property number from design.md). Write files only inside this folder. You cannot run shell commands: write code that passes 'npm test' (vitest run) and 'npm run build' (tsc --noEmit && vite build) under TypeScript strict with noUncheckedIndexedAccess. When done, mark task 4 and its sub-tasks as [x] in tasks.md. Finish with a short summary.

- steering: product.md, safety.md, structure.md, tech.md
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/tasks.md","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/design.md","offset":null,"limit":null}
- tool `list_directory`: List Directory {"path":"./.kiro/steering","explanation":null,"depth":null}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/requirements.md","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/domain/server.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/domain/ladder.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./tests/domain/server.test.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./tsconfig.json","offset":null,"limit":null}
- tool `fs_write`: Write File {"path":"./src/domain/ghosts.ts","text":"import type { Reading } from './server';\n\nexport type Ghost = { fear: string; ...
- tool `fs_write`: Write File {"path":"./src/domain/storage.ts","text":"import type { LadderDraft } from './ladder';\n\nexport type Saved = { draft: L ...
- tool `fs_write`: Write File {"path":"./tests/domain/ghosts.test.ts","text":"import { describe, it, expect } from 'vitest';\nimport fc from 'fast-che ...
- tool `fs_write`: Write File {"path":"./tests/domain/storage.test.ts","text":"import { describe, it, expect, beforeEach } from 'vitest';\nimport fc f ...
- tool `str_replace`: Replace in File {"path":"./.kiro/specs/haunted-ladder/tasks.md","oldStr":"- [ ] 4. Domain: ghosts and storage\n - [ ] 4.1 Implement `gho ...
## Kiro

Task 4 and its sub-tasks are written and marked `[x]` in `tasks.md`. I couldn't run `npm test` or `npm run build` here, so none of it has been run or type-checked.

- **`src/domain/ghosts.ts`:** `ghostsFromReading` gives one ghost per `fear` step, in server order and with the person's words unchanged. `isFaded` and `allFaded` follow the design. `allFaded` is true for an empty list.
- **`src/domain/storage.ts`:** `save`, `load` and `clear` use the key `haunted-ladder:v1`. `load` returns `null` for missing, broken or wrongly shaped data. None of the three throws, so the app keeps working in memory if storage fails.
- **`tests/domain/ghosts.test.ts`:** property tests for Property 6 (ghost fading) and Property 7 (one ghost per fear), each with 100 runs and tagged with the property number.
- **`tests/domain/storage.test.ts`:** Property 9 (round trip, and broken JSON gives `null`), plus a test with a storage that throws.

The storage test leaves out the key `__proto__` when it generates step records. That key doesn't compare cleanly after a JSON round trip.

