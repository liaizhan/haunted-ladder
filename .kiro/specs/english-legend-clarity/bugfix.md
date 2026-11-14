# Bugfix: English legend names are unclear to an international reader

## Summary

The legend under the reading explains the seven Kazakh images on the ladder. In English each line opened with a Kazakh word (Zheztyrnaq, Peri, Shanyraq, Asyq, Tumar, Qobyz, Burkit). A reader who does not know Kazakh folklore saw seven unknown words before any meaning. Reported by Aizhan Li after watching the screen recordings: "this will not be clear to American judges".

## Current Behavior (Defect)

1. WHEN the interface language is English AND the reading is shown THEN the system starts each legend line with the Kazakh name, for example "Zheztyrnaq, the copper-clawed spirit of Kazakh legends. Here she is a fear without a step."
2. WHEN the interface language is English THEN the system does not say what the object is (a witch, a fairy, a yurt crown, a knucklebone, an amulet, a fiddle, an eagle) before the reader meets the Kazakh word.
3. WHEN the interface language is English THEN the Qobyz line names Korkyt Ata without saying who he is.

## Expected Behavior (Correct)

1. WHEN the interface language is English AND the reading is shown THEN the system SHALL start each legend line with the plain English meaning and give the Kazakh name in brackets right after it, for example "A copper-clawed witch (Zheztyrnaq) from Kazakh legends."
2. WHEN the interface language is English THEN the system SHALL say in the same line what the image means on the person's ladder (a fear with no step yet, a fear that got a step, home, luck, protection, the goal).
3. WHEN the interface language is English THEN the Qobyz line SHALL call it a horsehair fiddle and call Korkyt Ata a legendary bard.

## Unchanged Behavior (Regression Prevention)

1. WHEN the interface language is Russian or Kazakh THEN the system SHALL CONTINUE TO show the current legend lines word for word.
2. WHEN the legend is rendered THEN the system SHALL CONTINUE TO use the same seven keys (`legendZheztyrnaq` to `legendBurkit`), the same order and the same seven pictures from `LEGEND_ITEMS` in `src/ui/reading.ts`.
3. WHEN any legend line is rendered THEN the system SHALL CONTINUE TO set it with `textContent`, never `innerHTML`.
4. WHEN the locales are compared THEN every key SHALL CONTINUE TO exist in `ru`, `kk` and `en` (Property 21).
