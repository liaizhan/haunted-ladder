// English interface texts. The form questions here are our own short English wording.
// The Russian and Kazakh question texts (ru.ts, kk.ts) come from the Ladder server tool
// `get_ladder_questions`; its English answer was read at the same time for comparison.

export const en = {
  skipLink: 'Skip to content',
  langLabel: 'Language',

  introTagline: 'Climb if you dare.',
  introP1:
    'Write down your goal. Every fear that holds you in place takes a step as a spirit from Kazakh legends. Name it, write one small step, and the spirit turns into a light one.',
  introP2: 'A few minutes. Your words go to the Ladder server only for the reading, and the server does not keep them. By Aizhan Li, author of the Ladder method.',
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
    'Every ghost has a name and a next step now. A named fear often feels smaller.',
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
  heartRate: 'Heart: {bpm} beats per minute. A small step can help it calm down.',
  heartUnit: 'beats per minute',
  heartStageFear: 'Fear grips the heart.',
  heartStageEasing: 'It gets lighter. One more step.',
  heartStageCalm: 'The heart is calm.',

  legendTitle: 'Who lives on this ladder',
  legendZheztyrnaq:
    'A copper-clawed witch (Zheztyrnaq) from Kazakh legends. On your ladder she is a fear with no step yet.',
  legendPeri:
    'A bright fairy (Peri) from Persian and Turkic tales. A fear turns into her once you write one small step.',
  legendShanyraq: 'The crown of the yurt (Shanyraq): home, the place you start from.',
  legendAsyq: 'A lucky knucklebone (Asyq) from an old Kazakh game. Here it marks your nearest obstacle.',
  legendTumar: 'A folk amulet (Tumar): in the legends, a charm against harm. Here it marks the hard steps.',
  legendQobyz:
    'A horsehair fiddle (Qobyz). In the legend, the bard Korkyt Ata played it to keep death away.',
  legendBurkit: 'A golden eagle (Burkit): freedom at your goal.',
};

export type Dict = Record<keyof typeof en, string>;
