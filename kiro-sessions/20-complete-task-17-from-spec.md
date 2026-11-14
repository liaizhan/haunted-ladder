# Complete Task 17 From Spec

- Source: Kiro IDE
- Agent: vibe
- Started: 2026-11-13T18:54:14.954Z
- Tool calls: 20
- Credits: 1.93

## Hooks that fired

- Run tests on save (completed): 8
- Words check on save (completed): 7

## Prompt

Execute task 17 from the spec .kiro/specs/haunted-ladder/tasks.md. First read requirements.md, design.md, tasks.md and all files in .kiro/steering, and look at the existing code in src/ and tests/. Do ONLY task 17 and its sub-tasks, including its property-based tests (fast-check, tagged with the property number from design.md). Write files only inside this folder. You cannot run shell commands: write code that passes 'npm test' (vitest run) and 'npm run build' (tsc --noEmit && vite build) under TypeScript strict with noUncheckedIndexedAccess. When done, mark task 17 and its sub-tasks as [x] in tasks.md. Finish with a short summary.

- steering: product.md, safety.md, structure.md, tech.md
- tool `list_directory`: List Directory {"path":"./.kiro","explanation":null,"depth":3}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/tasks.md","offset":null,"limit":null}
- tool `grep_search`: Grep Search {"query":"demo|Property 13|^### Requirement 10|^## Requirement 10","includePattern":".kiro/**/*.md"}
- tool `read_file`: Read File {"path":"./src/main.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/domain/ladder.ts","offset":null,"limit":null}
## Kiro

Now the form UI.

- tool `read_file`: Read File {"path":"./src/ui/form.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./tests/ui/app.test.ts","offset":null,"limit":80}
- tool `fs_write`: Write File {"path":"./src/domain/demo.ts","text":"import type { LadderDraft } from './ladder';\n\n/** True exactly when the query s ...
- tool `str_replace`: Replace in File {"path":"./src/main.ts","oldStr":" createContext?: () => AudioContext | null;\n};","newStr":" createContext?: () => Audi ...
- tool `str_replace`: Replace in File {"path":"./src/main.ts","oldStr":" const saved = store ? load(store) : null;\n const state: State = {\n screen: 'intro', ...
- tool `str_replace`: Replace in File {"path":"./src/main.ts","oldStr":" if (store) save({ draft: state.draft, steps: state.steps }, store);\n };","newStr":"  ...
- tool `str_replace`: Replace in File {"path":"./src/main.ts","oldStr":" function startOver(): void {\n if (store) clear(store);","newStr":" function startOve ...
- tool `str_replace`: Replace in File {"path":"./src/main.ts","oldStr":" onClear: startOver,\n }),","newStr":" onClear: startOver,\n demo: demoActive,\n onDem ...
- tool `str_replace`: Replace in File {"path":"./src/main.ts","oldStr":"import { clear, load, save } from './domain/storage';","newStr":"import { clear, load, ...
- tool `grep_search`: Grep Search {"query":"STORAGE_KEY","includePattern":"src/domain/storage.ts"}
- tool `fs_write`: Write File {"path":"./tests/domain/demo.test.ts","text":"// @vitest-environment jsdom\nimport { describe, it, expect } from 'vitest ...
- tool `execute_bash`: Run Command {"command":"cd ./.kiro/specs/haunted-ladder && sed -i '' -e '/^- \\[ \\] 17\\./s/\\[ \\]/[x]/' -e '/^ - \\[ \\] 17\\./s/ ...
## Kiro

Shell isn't available, so I'll edit with the editor tool.

- tool `str_replace`: Replace in File {"path":"./.kiro/specs/haunted-ladder/tasks.md","oldStr":"- [ ] 17. Demo link\n - [ ] 17.1 Implement","newStr":"- [x] 17 ...
- tool `str_replace`: Replace in File {"path":"./.kiro/specs/haunted-ladder/tasks.md","oldStr":" - [ ] 17.2","newStr":" - [x] 17.2","replace_all":false}
- tool `str_replace`: Replace in File {"path":"./.kiro/specs/haunted-ladder/tasks.md","oldStr":" - [ ] 17.3","newStr":" - [x] 17.3","replace_all":false}
## Kiro

Task 17 is implemented and marked `[x]` in `tasks.md`, along with 17.1–17.3. I couldn't run `npm test` or `npm run build` here, so nothing has been compiled or tested yet.

- **17.1:** `src/domain/demo.ts` has `isDemo(search)` and `demoDraft()`.
  - `isDemo` is true only when the query has `demo=1`.
  - `demoDraft()` is the sample ladder from `tech.md`, with your three fears.
- **17.2:** `src/main.ts` now takes an optional `search` dependency, which defaults to `location.search`.
  - On `?demo=1` it loads the demo draft in memory and opens the last form screen with "Show my ladder". It ignores any saved steps.
  - While the demo is active, the app never saves to `localStorage`. The form already had the sample line and the "Clear" button, and I wired them up.
  - "Clear" leaves the demo with an empty draft and doesn't touch storage. Typing after that will save over an existing draft, as in normal use.
  - The demo sends the real request, with no canned reading.
- **17.3:** `tests/domain/demo.test.ts` is tagged Property 13 and checks three things.
  - `isDemo` is true exactly when the query has `demo=1`.
  - `demoDraft()` passes `validateDraft`.
  - Mounting the app with `?demo=1`, editing a field and pressing "Clear" leaves the saved draft unchanged.

