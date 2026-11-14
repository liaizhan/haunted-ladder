# Implement Task 9 From Haunted Ladder

- Source: Kiro IDE
- Agent: vibe
- Started: 2026-11-13T18:42:25.055Z
- Tool calls: 17
- Credits: 1.82

## Hooks that fired

- Words check on save (completed): 2
- Run tests on save (completed): 2

## Prompt

Execute task 9 from the spec .kiro/specs/haunted-ladder/tasks.md. First read requirements.md, design.md, tasks.md and all files in .kiro/steering, and look at the existing code in src/ and tests/. Do ONLY task 9 and its sub-tasks, including its property-based tests (fast-check, tagged with the property number from design.md). Write files only inside this folder. You cannot run shell commands: write code that passes 'npm test' (vitest run) and 'npm run build' (tsc --noEmit && vite build) under TypeScript strict with noUncheckedIndexedAccess. When done, mark task 9 and its sub-tasks as [x] in tasks.md. Finish with a short summary.

- steering: product.md, safety.md, structure.md, tech.md
- tool `list_directory`: List Directory {"path":"./.kiro","explanation":null,"depth":3}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/tasks.md","offset":null,"limit":null}
- tool `list_directory`: List Directory {"path":"./.kiro/specs/haunted-ladder","explanation":null,"depth":null}
- tool `list_directory`: List Directory {"path":"./.kiro/steering","explanation":null,"depth":null}
- tool `read_file`: Read File {"path":"./src/main.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./.kiro/steering/style.md","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/design.md","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./.kiro/specs/haunted-ladder/requirements.md","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/ui/reading.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/domain/storage.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/styles.css","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./tests/ui/reading.test.ts","offset":null,"limit":30}
- tool `grep_search`: Grep Search {"query":"^export","includePattern":"src/domain/server.ts"}
- tool `fs_write`: Write File {"path":"./src/ui/calm.ts","text":"import type { Crisis, Failure, Health } from '../domain/server';\nimport { clear } fr ...
- tool `str_replace`: Replace in File {"path":"./src/styles.css","oldStr":"h1,\nh2,\nh3 {","newStr":"body.calm *,\nbody.calm *::before,\nbody.calm *::after {\ ...
- tool `fs_write`: Write File {"path":"./tests/ui/calm.test.ts","text":"// @vitest-environment jsdom\nimport { describe, it, expect, vi, beforeEach }  ...
- tool `str_replace`: Replace in File {"path":"./.kiro/specs/haunted-ladder/tasks.md","oldStr":"- [ ] 9. Calm screens\n - [ ] 9.1 Crisis screen: add class `ca ...
## Kiro

Task 9 and its three sub-tasks are done and marked `[x]` in `tasks.md`. I couldn't run `npm test` or `npm run build`, so none of it has been run or type-checked.

- **`src/ui/calm.ts` (new):**
  - `buildCalm` returns the DOM node for the crisis, health or error screen.
  - `showCalm` stops sound through an optional `kill` callback, adds `calm` to `<body>`, and removes every `.stair`, `.ghost`, `.cobweb`, `.moon`, `.fog` and `.heart` element from the page. On a crisis answer it also clears the saved draft.
  - `leaveCalm` removes the `calm` class again.
- **Crisis screen:** it shows the server `message` as plain text, a link to `helpUrl`, and one button, "Back to the start". The link is only built for `http` and `https` URLs. Anything else is shown as plain text.
- **Health screen:** it shows the `message` and an "Edit answers" button. The draft stays saved.
- **Error screen:** it shows a short fixed message with "Try again" and "Edit answers".
- **`src/styles.css`:** `body.calm` now turns off all animation and transitions and uses dark buttons on the white background.
- **`tests/ui/calm.test.ts` (new):** a fast-check test for Property 5, with 100 runs, plus unit tests for the health and error screens. The Property 5 test checks that no spooky element is left, `kill` is called, the draft is gone, and the message is rendered as text with only one button.

`main.ts` is still a stub, so nothing calls `showCalm` yet. `nightSound.ts` doesn't exist either, so the `kill` callback is only exercised by a mock.

