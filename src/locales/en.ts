// English interface texts. The form questions here are our own short English wording.
// The Russian and Kazakh question texts (ru.ts, kk.ts) come from the Ladder server tool
// `get_ladder_questions`; its English answer was read at the same time for comparison.

export const en = {
  skipLink: 'Skip to content',
  langLabel: 'Language',

  introP1:
    'A gentle, spooky self-check built on the Ladder method by Aizhan Li. ' +
    'Write your goal, where you are now, what stands in the way and what scares you. ' +
    'Your fears become ghosts you can see, name and make fade.',
  introP2: 'It takes a few minutes. Your words stay in your browser.',
  introStart: 'Start',
  introSample: 'See a sample ladder',

  progress: 'Question {n} of {total}',
  qGoalTitle: 'What is your goal?',
  qGoalHelp: 'Something you can measure, like "Launch my online course by March".',
  qMeTitle: 'Where are you now?',
  qMeHelp: 'One honest sentence about where you stand today.',
  qBlocksTitle: 'What stands in the way?',
  qBlocksHelp:
    'Short things people said that you believe, like "Dad: nobody pays for courses". Write 3 to 5.',
  qFearsTitle: 'What scares you if it comes true?',
  qFearsHelp: 'Optional, up to 5. A fear becomes smaller when it has a name and a next step.',
  fieldGoal: 'My goal',
  fieldMe: 'I am here',
  fieldObstacle: 'Obstacle {n}',
  fieldFear: 'Fear {n}',
  remove: 'Remove',
  removeObstacleAria: 'Remove obstacle {n}',
  removeFearAria: 'Remove fear {n}',
  addObstacle: 'Add obstacle',
  addFear: 'Add fear',
  limit: '{max} is the limit.',
  hintEmpty: 'Write a few words to continue.',
  hintTooLong: 'Please keep it to {max} characters or fewer.',
  next: 'Next',
  back: 'Back',
  showLadder: 'Show my ladder',
  clearAnswers: 'Clear my answers',
  sampleLine: 'Sample ladder.',
  writeOwn: 'Write my own',

  waiting: 'Reading your ladder…',

  resultTitle: 'Your haunted ladder',
  editAnswers: 'Edit my answers',
  saveLadder: 'Save my ladder',
  closingLine:
    'Every ghost has a name and a next step now. That is a real way to make a fear smaller.',
  ghostBlockTitle: 'Make the ghosts smaller',
  ghostBlockHelp: 'A fear becomes smaller when it has a name and a next step.',
  stepLabel: 'My small step this week',
  stepFor: 'for the fear: {fear}',
  insightsTitle: 'What your ladder shows',
  questionsTitle: 'Two questions to think about',

  crisisBack: 'Back to the start',
  calmEdit: 'Edit answers',
  tryAgain: 'Try again',
  errorMessage:
    'Something went wrong and the reading did not arrive. Your answers are safe. Please try again.',

  nightSound: 'Night sound',
  soundWasOn: 'Sound was on last time. Press to play.',
  dawnLine: 'Morning. Every fear has a next step.',

  creditLine: 'Haunted Ladder, built on the Ladder method by Aizhan Li',
  saveFailed:
    'We could not make the picture this time. Your steps are still here, please try again.',
  exportFear: 'Fear: {fear}',
  exportStep: 'My small step: {step}',
  exportTitle: 'My small steps this week',

  staircaseAria: 'Your ladder as a staircase at night',
  badgeMe: 'me',
  badgeGoal: 'goal',
  noGhosts: 'No ghosts were found above your goal.',
  ghostAria: 'Ghost: {fear}',
  ghostFadedAria: 'Ghost, faded, has a small step: {fear}',
  heartRate: 'Heart rate: {bpm} beats per minute',

  legendTitle: 'Who lives on this ladder',
  legendZheztyrnaq:
    'Zheztyrnaq, the copper-clawed spirit of Kazakh legends. Here she is a fear without a step.',
  legendPeri:
    'Peri, a bright spirit of Turkic tales. A fear turns into her when you write one small step.',
  legendShanyraq: 'Shanyraq, the crown of the yurt: home and the place you start.',
  legendAsyq: 'Asyq, the knucklebone of an old Kazakh game: luck for your nearest obstacle.',
  legendTumar: 'Tumar, a folk amulet: protection on the hard steps.',
  legendQobyz:
    'Qobyz, the instrument of Korkyt Ata. In the legend, death could not come near while he played.',
  legendBurkit: 'Burkit, the golden eagle: freedom at your goal.',
};

export type Dict = Record<keyof typeof en, string>;
