# Design: English legend clarity

## Root cause

The English strings in `src/locales/en.ts` were translated from the Russian lines, which can open with the Kazakh word because a Russian or Kazakh reader already knows it. The English line kept that order, so the meaning came second.

## Fix

Rewrite only the seven `legend*` values in `src/locales/en.ts`. Pattern: meaning first, Kazakh name in brackets, then what it means on the ladder. Do not touch `ru.ts`, `kk.ts`, the keys or `reading.ts`.

## Properties to test

- **Property 21 (existing, updated):** for every language the legend renders seven items in the same order, and the English Qobyz line equals the new text.
- **Property B1 (new check, same test file):** for every English legend line, the first bracketed word is the Kazakh name and it is not the first word of the line.
