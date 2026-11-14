# Rewrite README.md for the Kiroween 2026 judges. Read first: .kiro/steering/devpost-writeup.md, the current README.md, the rules excerpt /private/tm...

- Source: kiro-cli
- Agent: kiro-cli
- Started: 2026-11-14T18:18:36.127615Z
- Tool calls: 2

## Prompt

Rewrite README.md for the Kiroween 2026 judges. Read first: .kiro/steering/devpost-writeup.md, the current README.md, the rules excerpt /private/tmp/claude-501/-Users-aizhanli-AI-ladder/2b59d4d4-a086-4f40-8a66-446c68fbd9a0/scratchpad/kiroween-rules.md and the verified facts /private/tmp/claude-501/-Users-aizhanli-AI-ladder/2b59d4d4-a086-4f40-8a66-446c68fbd9a0/scratchpad/readme-facts.md. Use only facts from those files and the repo; if a fact is not there, leave it out. Keep the opening (title, tagline, what the app does), the Safety section and the Pre-existing work section in spirit. Structure: title and tagline; one paragraph what it is; Links (live app, demo link, repo, video line exactly as given); Summary for judges (category Costume Contest, bonus Best Startup Project with founder and 108psy.com); Safety; Privacy (corrected wording: the only request to another server is the reading); How it was built with Kiro, grouped as Specs, Steering, Hooks, Custom agents, MCP, Power and skill, Release workflow, Kiro IDE and CLI, Exported sessions, with real paths and correct counts, and one honest line on spec versus quick changes; Architecture link to ARCHITECTURE.md and AGENTS.md; Run locally (Node 20, local URL, test, build, screens, check:locales); Third-party material and pre-existing work (font with OFL, AI-made art approved by the author, Playwright MCP, the Ladder server and method); License MIT. Plain short English, judges are busy. Rules: never call Aizhan Li a psychologist or therapist, she is author of the Ladder method; no prices; no health or life promises; no em dash, no arrow symbol, no middle dot; Kazakh words with meaning first. Edit only README.md.

- tool `read`: {"operations":[{"mode":"Line","path":"./.kiro/steering/devpost-writeup.md"},{"mode":"Line","path":"./README.md"},{"mode" ...
- tool `write`: {"command":"create","path":"./README.md","content":"# Haunted Ladder\n\nYour fears are ghosts on the stairs to your goal ...
## Kiro

I rewrote `README.md` using the section order you gave. I only edited that file and didn't run any checks on it.

- **Sources:** every fact comes from `readme-facts.md`, the rules excerpt, `devpost-writeup.md` or the old README. The counts are 19 requirements, 21 properties, 27 tasks, 7 steering files, 10 hooks in 9 files, and 33 IDE chats plus 4 CLI chats, which makes 37 exported.
- **Links:** the video line is exactly as you gave it.
- **Honest line on spec versus quick changes:** I kept it as the old README had it. The core went through the full spec with property tests, and the starfall went through a quick spec. The legend wording went through a bugfix spec.
- **Style rules:** the text has no em dashes, arrows or middle dots, and no price or health promises. It calls Aizhan Li the author of the Ladder method and the founder of the startup behind it. Kazakh words come with their meaning first, for example the copper-clawed witch (Zheztyrnaq) and the bright golden spirit (Peri).

I left out the LinkedIn profile, because the facts say it goes in the Devpost form and not in the README.

You still need to add the real video link before you submit, and you need to read the full text and say yes.

