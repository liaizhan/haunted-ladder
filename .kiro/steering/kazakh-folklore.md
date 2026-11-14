---
inclusion: manual
---

# Kazakh folklore on the ladder

Pull this file into the chat with `#kazakh-folklore` when you add or change a spirit, a picture or a legend line.

## The seven images

- **Zheztyrnaq** (Жезтырнақ): a copper-clawed witch of Kazakh legends. On the ladder she is a fear with no step yet. She is eerie, never gory: no blood, no visible wounds, no jump scares.
- **Peri** (Пері): a bright fairy of Turkic tales. A fear turns into her once the person writes one small step.
- **Shanyraq** (Шаңырақ): the crown of the yurt. Home, the "I" point where the person starts.
- **Asyq** (Асық): a knucklebone from an old Kazakh game. Luck for the nearest obstacle.
- **Tumar** (Тұмар): a folk amulet. Protection on the hard steps.
- **Qobyz** (Қобыз): the horsehair fiddle of the legendary bard Korkyt Ata. As long as he played, death could not come near.
- **Burkit** (Бүркіт): a golden eagle. Freedom at the goal.

## How to write about them

- In English always put the meaning first and the Kazakh name in brackets: "A copper-clawed witch (Zheztyrnaq) from Kazakh legends." An international reader does not know these words. See the bugfix spec `english-legend-clarity`.
- In Russian and Kazakh the name can come first.
- Respect the culture: these are living symbols for many families. No jokes about the shanyraq, no "cursed" amulets, no mocking of Korkyt Ata.
- New text goes into `src/locales/en.ts`, `ru.ts` and `kk.ts` at once, with the same key.

## Pictures

- Night steppe palette from `style.md`: deep blue, copper, warm gold light. No neon Halloween orange and green.
- Every new picture: two AI variants are shown to Aizhan Li before use, and only the approved one goes into `public/art`.
- Add the picture name to `ArtName` in `src/ui/art.ts` and to `LEGEND_ITEMS` in `src/ui/reading.ts` if it belongs in the legend.

#[[file:src/ui/reading.ts]]
