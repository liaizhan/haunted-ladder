# Implementation Plan

- [x] 1. Add `METEORS` (40 fixed tuples) to `src/main.ts`
  - _Requirements: 1.1, 1.2_
- [x] 2. Render `div.w-meteors` with 40 `span.w-meteor` on the waiting screen, behind the steps
  - _Requirements: 1.1, 1.4, 1.5_
  - _Depends on: 1_
- [x] 3. Style `.w-meteors`, `.w-meteor` and the `w-meteor-fall` animation under `prefers-reduced-motion: no-preference` in `src/styles.css`
  - _Requirements: 1.3, 1.4_
- [x] 4. Write tests for S1, S2 and S3 in `tests/ui/starfall.test.ts`
  - _Requirements: 1.1, 1.3, 1.5_
  - _Depends on: 2, 3_
