# Fix Accessibility Test Assertion Error

- Source: Kiro IDE
- Agent: vibe
- Started: 2026-11-13T18:45:43.788Z
- Tool calls: 12
- Credits: 1.29

## Hooks that fired

- Words check on save (completed): 4
- Run tests on save (completed): 3

## Prompt

Task 11 of .kiro/specs/haunted-ladder/tasks.md is implemented but 'npm test' or 'npm run build' fails. Fix the code (not by deleting or weakening tests or properties) so both pass. Output of the checks:
Shrunk 15 time(s)
Got AssertionError: expected <body>…(1)</body> not to be <body>…(1)</body> // Object.is equality
    at ./tests/ui/accessibility.test.ts:130:44
    at Property.predicate (file://./node_modules/fast-check/lib/esm/check/property/Property.js:14:54)
    at Property.run (file://./node_modules/fast-check/lib/esm/check/property/Property.generic.js:46:33)
    at runIt (file://./node_modules/fast-check/lib/esm/check/runner/Runner.js:18:30)
    at check (file://./node_modules/fast-check/lib/esm/check/runner/Runner.js:62:11)
    at Module.assert (file://./node_modules/fast-check/lib/esm/check/runner/Runner.js:65:17)
    at ./tests/ui/accessibility.test.ts:114:8
    at file://./node_modules/@vitest/runner/dist/index.js:146:14
    at file://./node_modules/@vitest/runner/dist/index.js:533:11
    at runWithTimeout (file://./node_modules/@vitest/runner/dist/index.js:39:7)

Hint: Enable verbose mode in order to have the list of all failing values encountered during the run
 ❯ tests/ui/accessibility.test.ts:130:44
    128|         }
    129|         // focus moves into the screen on render
    130|         expect(document.activeElement).not.toBe(document.body);
       |                                            ^
    131|       }),
    132|       RUNS,
 ❯ Property.predicate node_modules/fast-check/lib/esm/check/property/Property.js:14:54
 ❯ Property.run node_modules/fast-check/lib/esm/check/property/Property.generic.js:46:33
 ❯ runIt node_modules/fast-check/lib/esm/check/runner/Runner.js:18:30
 ❯ check node_modules/fast-check/lib/esm/check/runner/Runner.js:62:11
 ❯ Module.assert node_modules/fast-check/lib/esm/check/runner/Runner.js:65:17
 ❯ tests/ui/accessibility.test.ts:114:8
 ❯ buildError node_modules/fast-check/lib/esm/check/runner/utils/RunDetailsFormatter.js:126:15
 ❯ throwIfFailed node_modules/fast-check/lib/esm/check/runner/utils/RunDetailsFormatter.js:138:11
 ❯ reportRunDetails node_modules/fast-check/lib/esm/check/runner/utils/RunDetailsFormatter.js:151:16
 ❯ Module.assert node_modules/fast-check/lib/esm/check/runner/Runner.js:69:9
 ❯ tests/ui/accessibility.test.ts:114:8

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/3]⎯

 Test Files  1 failed | 9 passed (10)
      Tests  3 failed | 38 passed (41)
   Start at  23:45:38
   Duration  1.94s (transform 310ms, setup 0ms, collect 1.37s, tests 2.70s, environment 5.81s, prepare 1.61s)

TEST_EXIT=1

> [email] build
> tsc --noEmit && vite build

vite v5.4.11 building for production...
transforming...
✓ 4 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                 0.70 kB │ gzip: 0.40 kB
dist/assets/index-Bum_9pnE.css  3.20 kB │ gzip: 1.23 kB
dist/assets/index-BXRVPASX.js   0.84 kB │ gzip: 0.46 kB
✓ built in 41ms
BUILD_EXIT=0

- steering: product.md, safety.md, structure.md, tech.md
- tool `read_file`: Read File {"path":"./tests/ui/accessibility.test.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/main.ts","offset":null,"limit":null}
- tool `read_file`: Read File {"path":"./src/ui/form.ts","offset":null,"limit":null}
- tool `grep_search`: Grep Search {"query":"section|createForm","includePattern":"tests/**"}
- tool `grep_search`: Grep Search {"query":"section|\\.screen","includePattern":"src/**"}
- tool `execute_bash`: Run Command {"command":"cd . && python3 - <<'E'\np='src/ui/form.ts'\ns=open(p).read()\ns=s.replace(\"\"\"function hintFor\"\"\",\"\" ...
- tool `execute_bash`: Run Command {"command":"cd . && git status --short | head","run_in_background":false}
- tool `str_replace`: Replace in File {"path":"./src/ui/form.ts","oldStr":"function hintFor","newStr":"/**\n * A section that runs a callback when it is attac ...
- tool `str_replace`: Replace in File {"path":"./src/ui/form.ts","oldStr":" const root = el('section', undefined, 'screen form');","newStr":" const root = doc ...
- tool `str_replace`: Replace in File {"path":"./src/ui/form.ts","oldStr":" toFocus.focus();\n }\n\n render();","newStr":" toFocus.focus();\n pendingFocus = t ...
- tool `str_replace`: Replace in File {"path":"./src/styles.css","oldStr":"/* Form screens */","newStr":"/* Form screens */\nform-screen {\n display: block;\n ...
- tool `execute_bash`: Run Command {"command":"npm test 2>&1 | tail -40; npm run build 2>&1 | tail -8","cwd":".","run_in_background":false}
## Kiro

I changed the form screen so focus moves into it when it's attached to the page. I couldn't run `npm test` or `npm run build`, so the fix is untested. Every shell command I tried failed with a permission error, including a plain `git status`.

**Cause.** `createForm` called `.focus()` while the form was still detached from the document. `focus()` does nothing on a detached node, so `document.activeElement` stayed on `<body>`. That is the failure at `accessibility.test.ts:130`.

**Fix.**
- `src/ui/form.ts`: the form root is now a small custom element, `<form-screen>`. Its `connectedCallback` re-applies focus to the field or heading that `render()` picked. Focus is therefore set when the form is attached, which the test does right after `createForm`.
- `src/styles.css`: I added `form-screen { display: block; }` so the layout is the same as the old `<section>`.

I didn't change any tests.

**What I haven't verified.**
- Whether the other two failures in "3 failed" are fixed. Your output only showed the one at line 130, so I don't know what the other two were. If they remain, send me their output.
- The jsdom custom-element behavior and the TypeScript build, which I haven't run.

Please run `npm test && npm run build` and share the output if anything still fails. I can also retry once shell permission is granted.

