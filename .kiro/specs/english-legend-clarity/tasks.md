# Implementation Plan

- [x] 1. Rewrite the seven English legend lines in `src/locales/en.ts` (meaning first, Kazakh name in brackets)
  - _Bugfix: Expected 1, 2, 3_
- [x] 2. Update the expected English Qobyz text in the Property 21 test in `tests/ui/spirits.test.ts`
  - _Bugfix: Unchanged 2, 4_
- [x] 3. Run `npm test` and check that `ru.ts` and `kk.ts` have no diff
  - _Bugfix: Unchanged 1_
- [x] 4. Add the Property B1 test: each English line has the Kazakh name in brackets and does not start with it
  - _Bugfix: Expected 1_
