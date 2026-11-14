---
name: add-spirit
description: Add a new spirit from Kazakh legends to Haunted Ladder, with its picture, its legend line in English, Russian and Kazakh, and the tests. Use when asked to add, swap or rename a spirit, a ghost or a legend item.
---

# Add a spirit to Haunted Ladder

A spirit is a fear on the ladder, drawn as a figure from Kazakh legends. The legend strip under the reading names each one. Follow these steps in order.

## 1. Choose the spirit

- Take it from Kazakh folklore. Check the name and the meaning in two sources. Do not invent a legend.
- Read `.kiro/steering/kazakh-folklore.md` first (it is a manual steering file, so add it with `#kazakh-folklore`).
- No blood, no gore, no mocking of the culture. Night, steppe, yurt, moon and stars are the setting.

## 2. Picture

- Make two variants and show both to the author before using one. Never pick for her.
- Save the chosen picture as WebP in `public/art/`, at most 200 KB, with a transparent background.

## 3. Code

- Add the item to `LEGEND_ITEMS` in `src/ui/reading.ts` with a new `key` and the `art` name.
- Add the legend line to all three dictionaries: `src/locales/en.ts`, `src/locales/ru.ts`, `src/locales/kk.ts`.
- English line: the meaning first, the Kazakh name in brackets. Example: "A horsehair fiddle (Qobyz) of the legendary bard Korkyt Ata."
- Run `npm run check:locales`. It must say "passed".

## 4. Tests

- `tests/ui/spirits.test.ts` checks that every legend item has a line in each language and that English starts with the meaning. Run `npx vitest run tests/ui/spirits.test.ts`.
- Then the whole suite: `npm test`.

## 5. Look at it

- Run the "Take screenshots" hook or `npm run screens` and open `screens/1280-3-reading.jpg` and `screens/390-3-reading.jpg`.
- Show the author the result. Do not commit or push without her yes.
