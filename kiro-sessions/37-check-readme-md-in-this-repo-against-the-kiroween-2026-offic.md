# Check README.md in this repo against the Kiroween 2026 official rules. Source: https://kiroween.devpost.com/rules. A saved excerpt of the rules is ...

- Source: kiro-cli
- Agent: kiro-cli
- Started: 2026-11-14T18:14:17.662455Z
- Tool calls: 17

## Prompt

Check README.md in this repo against the Kiroween 2026 official rules. Source: https://kiroween.devpost.com/rules. A saved excerpt of the rules is at /private/tmp/claude-501/-Users-aizhanli-AI-ladder/2b59d4d4-a086-4f40-8a66-446c68fbd9a0/scratchpad/kiroween-rules.md, read it first. Then read README.md, ARCHITECTURE.md, LICENSE, .gitignore, package.json, and list the .kiro folder (specs, steering, hooks, agents, settings, skills, workflows), powers/, kiro-sessions/ and src/api. Report a numbered list of gaps: (a) anything the rules require that README or the repo is missing, (b) any README claim that is no longer true about the repo (counts of requirements, properties, tasks, hooks; which Kiro features exist; the privacy claim about network requests), (c) Kiro features present in the repo that README does not mention. For each gap give the file and the exact README line. Do not edit any file. Do not use the long dash character.

- tool `read`: {"operations":[{"mode":"Line","path":"/private/tmp/claude-501/-Users-aizhanli-AI-ladder/2b59d4d4-a086-4f40-8a66-446c68fb ...
- tool `read`: {"operations":[{"mode":"Line","path":"./README.md"},{"mode":"Line","path":"./ARCHITECTURE.md"},{"mode":"Line","path":"./ ...
- tool `grep`: {"pattern":"^### Requirement|^## Requirement|^#+ Requirement","path":"./.kiro/specs/haunted-ladder/requirements.md","out ...
- tool `grep`: {"pattern":"^\\s*(###? )?\\**Property \\d+","path":"./.kiro/specs/haunted-ladder/design.md","output_mode":"count"}
- tool `grep`: {"pattern":"^- \\[[ x~]\\] \\d+\\. ","path":"./.kiro/specs/haunted-ladder/tasks.md","output_mode":"count"}
- tool `read`: {"operations":[{"mode":"Line","path":"./.kiro/settings/mcp.json"},{"mode":"Line","path":"./src/api/ladderClient.ts"},{"m ...
- tool `grep`: {"pattern":"fetch\\(|https?://","path":"./src","include":"*.ts"}
- tool `glob`: {"pattern":"{.github/workflows/*,index.html,public/**/*,.kiro/specs/haunted-ladder/*}","path":".","limit":40}
- tool `grep`: {"pattern":"^#+ Requirement|^### Property|^\\*\\*Property|^#### Property","path":"./.kiro/specs/haunted-ladder","output_ ...
- tool `grep`: {"pattern":"^- \\[[ x~]\\] \\d+\\. ","path":"./.kiro/specs/haunted-ladder/tasks.md","output_mode":"content","max_total_l ...
- tool `grep`: {"pattern":"fonts|font-face|googleapis","path":"./src","output_mode":"content","max_total_lines":10}
- tool `read`: {"operations":[{"mode":"Line","path":"./src/ui/exportImage.ts","offset":20,"limit":25}]}
- tool `grep`: {"output_mode":"count","path":"./.kiro/specs/haunted-ladder/requirements.md","pattern":"^### Requirement \\d+"}
- tool `grep`: {"output_mode":"content","path":"./.kiro/specs/haunted-ladder/design.md","pattern":"Property \\d+","max_total_lines":40}
- tool `grep`: {"output_mode":"content","path":"./.kiro/hooks","pattern":"\"name\"|\"trigger\""}
- tool `grep`: {"output_mode":"content","path":"./.kiro/specs/haunted-ladder/design.md","pattern":"^Property (2[0-9]|1[89]):"}
- tool `grep`: {"output_mode":"content","path":"./README.md","pattern":".","max_matches_per_file":0}
## Kiro

Gaps found, with README line numbers counted from the top of the file. I edited nothing.

**(a) Required by the rules, missing from README or the repo**

1. README.md line 13: "(Live link is added after the first deploy.)" There is no URL to the working app, which the rules require. Add the GitHub Pages URL, and `?demo=1` is already there for judges. `.github/workflows/deploy.yml` exists, so the deploy path is ready.
2. README.md, nowhere: there is no public repo URL, no demo video link (YouTube, public, under 3 minutes), and no statement that judges can test it free of charge through 29 Jan 2027. Add a short "Links" block near line 9.
3. README.md line 7: "category Costume Contest" names no bonus category. `product.md` says the bonus is Best Startup Project. For that bonus the rules ask for founder confirmation, a LinkedIn profile and a startup website. Add the bonus and those three items, or drop the bonus.
4. README.md lines 24 to 29: the rules ask how Kiro was used, and the section omits these topics:
   - which Kiro surface was used (IDE, CLI, Web or Crew);
   - custom agents;
   - Kiro powers;
   - where vibe coding was used and where specs worked better.

   `devpost-writeup.md` asks for the same things.
5. README.md lines 35 to 41 ("Run locally"): the instructions are thin. They give no Node version, no local URL (`http://localhost:5173/haunted-ladder/`) and no `npm run build`. `package.json` has no `engines` and no `license` field. Add these.
6. README.md line 33: the disclosure covers only the Ladder server and method. Three other third-party items sit in the repo and none is disclosed or credited:
   - `public/fonts/cormorant-sc-700-*.woff2` is a third-party font (Cormorant SC). Name it and its license.
   - `public/art/*.webp` is described in `structure.md` as "cut from approved art". State where the art came from and whether it was AI-generated.
   - `.kiro/settings/mcp.json` also uses `@playwright/[email]`.
7. LICENSE and `.gitignore` pass. LICENSE is standard MIT text. `.gitignore` does not exclude `.kiro`, though `*.log` does hide `.kiro/hook-runs.log`. That is fine, but README line 28 could say the log is local only.
8. Repo cleanliness: `.kiro/agents/haunted-builder.json.bak` is a stray backup. Delete it or ignore it before submitting.

**(b) README claims that are no longer true**

9. README.md line 26: "10 requirements". `requirements.md` has 19 (`### Requirement 1` to `19`).
10. README.md line 26: "13 correctness properties". `design.md` now has 22 (`Property 1` to `Property 22`).
11. README.md line 26: "a plan of 17 tasks". `tasks.md` has 27 top-level tasks. `ARCHITECTURE.md` says "25 tasks" in the "How Kiro builds it" diagram, which is also stale.
12. README.md line 28: "three hooks". `.kiro/hooks/` has 9 files holding 10 hooks:
    - `run-tests-on-save`
    - `words-check-on-save`
    - `safety-and-style-check` (PostTaskExec)
    - `locales-keys-check`
    - `prompt-guard`
    - `block-git-push`
    - `take-screens` (manual)
    - `screens-reminder` (Stop)
    - `compact-log`, which has two entries, PreCompact and PostCompact
13. README.md line 27: the steering list names five files (product, tech, structure, safety, style). The folder also has `kazakh-folklore.md` and `devpost-writeup.md`, so seven files in all.
14. README.md line 29: it describes only the Ladder server in `mcp.json`. The file also configures a Playwright MCP server.
15. README.md line 22: "The only network request is the reading from the Ladder server." This is not strictly true.
    - The page loads its own art and fonts from its own origin. `src/styles.css` has `@font-face` rules pointing at `/haunted-ladder/fonts/...`.
    - `src/ui/exportImage.ts` line 33 calls `fetch(url)` on its own art.

    None of this goes to a third party. Reword to "the only request to another server is the reading from the Ladder server. Fonts and pictures are served with the app."
16. `tech.md` says "No external fonts... Use a system font stack", but the app ships self-hosted Cormorant fonts. This is a steering drift, not a README line. Update `tech.md`, or README line 22 will be read against it.

**(c) Kiro features in the repo that README does not mention**

17. Custom agents: `.kiro/agents/haunted-builder.json` and `haunted-reviewer.json` (read only).
18. Release workflow: `.kiro/workflows/release.workflow.json`.
19. Skill: `.kiro/skills/add-spirit/SKILL.md`.
20. Power: `powers/ladder/` (`POWER.md`, `mcp.json`, `steering/reading-guide.md`).
21. Two more specs: `english-legend-clarity` (a bugfix spec) and `perseids-starfall` (a quick spec). The main spec also has `requirements-analysis.md`.
22. The Playwright MCP server, and these hook types, none of which README line 28 mentions:
    - PreToolUse (`block-git-push`);
    - UserPromptSubmit (`prompt-guard`);
    - Stop;
    - the compaction hooks;
    - a manual hook.
23. `kiro-sessions/`: 36 exported Kiro chats plus a README, produced by `npm run export:sessions`. Strong evidence of Kiro use that README never links.
24. `AGENTS.md` and `ARCHITECTURE.md` (with diagrams) exist but README links neither.
25. Scripts `npm run screens` and `npm run check:locales`. README also says nothing about the three interface languages (en, ru, kk), the property-test count, or the `src/api/ladderClient.ts` single-call design.

README itself has no long dash, no healing or cure promise, and no psychologist or therapist wording for the author. It names no folklore terms.

LANG OK

