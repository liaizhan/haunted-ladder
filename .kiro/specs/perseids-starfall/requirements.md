# Requirements: Perseids starfall while the reading loads

Quick Spec. All three documents were made in one pass.

## Introduction

While the person waits for the Ladder MCP server, the waiting screen shows the night steppe and the staircase lighting up step by step. In August the Perseids fall over the Kazakh steppe; people make a wish on a falling star. The starfall gives the waiting time a calm, hopeful meaning instead of a spinner.

### Requirement 1: Starfall on the waiting screen

**User Story:** As a person waiting for my reading, I want to see stars falling over the steppe, so that the wait feels like making a wish and not like a loading bar.

#### Acceptance Criteria

1. WHEN the waiting screen is shown THEN the system SHALL draw 40 meteor streaks over the sky part of the scene (the top 75 %).
2. WHEN the streaks are placed THEN the system SHALL use fixed, evenly spread values (start x %, start y %, length px, cycle s, delay s) so several always fall at once and two runs look the same.
3. WHEN the user prefers reduced motion THEN the system SHALL show the streaks still, at low opacity, with no animation.
4. WHEN the streaks are drawn THEN the system SHALL NOT catch pointer events, so they never block the screen.
5. WHEN the crisis screen is shown THEN the system SHALL NOT show any streak (safety.md).
