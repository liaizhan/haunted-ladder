# Review src/locales/en.ts for an American judge who knows nothing about Kazakh folklore: every spirit name has its English meaning first. Apply the ...

- Source: kiro-cli
- Agent: kiro-cli
- Started: 2026-11-14T17:57:42.031202Z
- Tool calls: 1

## Prompt

Review src/locales/en.ts for an American judge who knows nothing about Kazakh folklore: every spirit name has its English meaning first. Apply the rules from your profile. Keep the answer under 15 lines.

- tool `read`: {"operations":[{"mode":"Line","path":"./src/locales/en.ts"}]}
## Kiro

Findings for `src/locales/en.ts`. Line numbers are counted by hand.

- **Line 10 (`introP1`):** "Kazakh legends" has no gloss, and "Call it by its name and watch it fade" promises an outcome. Suggested fix: "Name it, write one small step, and the spirit changes into a light one."
- **Line 94 (`heartRate`):** "Every small step calms it down" states a body effect as certain. Suggested fix: "A small step can help it calm down."
- **Line 107 (`legendTumar`):** "protection on the hard steps" reads as a real promise of protection. Suggested fix: "A folk amulet (Tumar): in the legends, a charm against harm. Here it marks the hard steps."
- **Line 108-109 (`legendQobyz`):** "Korkyt Ata" and "death could not come near" mean nothing to this judge. Suggested fix: "A horsehair fiddle (Qobyz). In the legend, the bard Korkyt Ata played it to keep death away. Here it is a symbol for staying with the music of your goal."
- **Line 103-104 (`legendPeri`):** "Turkic tales" is inaccurate, because the Peri comes from Persian folklore and is shared across Turkic cultures. Suggested fix: "A bright fairy (Peri) from Persian and Turkic tales."
- **Line 106 (`legendAsyq`):** "luck for your nearest obstacle" is unclear. Suggested fix: "A lucky knucklebone (Asyq) from an old Kazakh game. Here it marks your nearest obstacle."
- **Line 61-62 (`closingLine`):** "a real way to make a fear smaller" is a mild outcome claim. Suggested fix: "A fear often feels smaller once it has a name and a next step."

These checks pass:
- Every spirit name has its English meaning first.
- No long dashes or arrows appear in the file.
- The author is described only as "author of the Ladder method".
- This file has no crisis text.

LANG ISSUES

