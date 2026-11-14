// English interface texts. The form questions here are our own short English wording.
// The Russian and Kazakh question texts (ru.ts, kk.ts) come from the Ladder server tool
// `get_ladder_questions`; its English answer was read at the same time for comparison.

export const en = {
  skipLink: 'Skip to content',
  langLabel: 'Language',

  introTagline: 'Climb if you dare.',
  introP1:
    'Write down your goal. Every fear that holds you in place takes a step as a spirit from Kazakh legends. Call it by its name and watch it fade.',
  introP2: 'A few minutes. Your words never leave your browser. By Aizhan Li, author of the Ladder method.',
  introStart: 'Start',
  introSample: 'See a sample ladder',

  progress: 'Question {n} of {total}',
  qGoalTitle: 'What is your goal?',
  qGoalHelp:
    'Something you can count, like "$2,000 a month" or "90 points on the exam by June".',
  qMeTitle:
    'You are here now, in your comfort zone. What keeps you stuck on this step, like in a swamp?',
  qMeHelp:
    'One sentence: where you are now on the way to your goal.',
  qBlocksTitle:
    'Above your step stand the obstacles. Most often they are people: their words stopped you once, and you still hear them. Who stands in your way, and what do they say?',
  qBlocksHelp:
    'Write 3 to 5 obstacles, starting from the lowest. For example: "Mom: who needs this?"',
  qFearsTitle:
    'There are steps above your goal too. Up there is what you fear will happen once the goal comes true. That is why you do not move toward it. Which fear stands above your goal?',
  qFearsHelp:
    'Optional. Write up to 5 fears: what will happen once the goal comes true.',
  fieldGoal: 'My goal',
  fieldMe:
    'Where I am now',
  fieldObstacle: 'Obstacle {n}',
  fieldFear: 'Fear {n}',
  remove: 'Remove',
  removeObstacleAria: 'Remove obstacle {n}',
  removeFearAria: 'Remove fear {n}',
  addObstacle: 'Add obstacle',
  addFear: 'Add fear',
  limit:
    'You cannot add more than {max}.',
  hintEmpty:
    'Write a couple of words and we will move on.',
  hintTooLong:
    'Too long: {max} characters at most.',
  next: 'Next',
  back: 'Back',
  showLadder: 'Show my ladder',
  clearAnswers:
    'Erase answers',
  sampleLine: 'Sample ladder.',
  writeOwn: 'Write my own',

  waiting: 'Reading your ladder…',

  resultTitle: 'Your ghosts are out of the dark',
  editAnswers: 'Edit my answers',
  saveLadder: 'Save my ladder as a picture',
  closingLine:
    'Every ghost has a name and a next step now. That is a real way to make a fear smaller.',
  ghostBlockTitle: 'Turn every dark spirit into a light one',
  ghostBlockHelp: 'Write one small step for a fear, and its dark spirit turns into a light one.',
  stepLabel: 'My step this week',
  stepPlaceholder: 'For example: a video for three friends',
  stepFor: '“{fear}”',
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
  heartRate: 'Heart: {bpm} beats per minute. Every small step calms it down.',
  heartUnit: 'beats per minute',
  heartStageFear: 'Fear grips the heart.',
  heartStageEasing: 'It gets lighter. One more step.',
  heartStageCalm: 'The heart is calm.',

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
