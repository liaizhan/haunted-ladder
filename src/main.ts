import './styles.css';
import { analyze } from './api/ladderClient';
import { validateDraft, type LadderDraft } from './domain/ladder';
import type { Answer, Reading } from './domain/server';
import { applySavedSteps, ghostsFromReading, isFaded, stepsRecord, type Ghost } from './domain/ghosts';
import { clear, load, save } from './domain/storage';
import { demoDraft, isDemo } from './domain/demo';
import { createForm } from './ui/form';
import { createIntro } from './ui/intro';
import { buildStaircase, updateGhosts } from './ui/staircase';
import { buildReading } from './ui/reading';
import { buildHeart, type HeartHandle } from './ui/heart';
import {
  attachGhostDrift,
  buildFog,
  dimForWaiting,
  type DriftHandle,
  type FogHandle,
} from './ui/fog';
import {
  buildSoundToggle,
  createNightSound,
  readBeatSeconds,
  type NightSound,
} from './ui/nightSound';
import { leaveCalm, showCalm, type CalmAnswer } from './ui/calm';
import { saveLadderImage } from './ui/exportImage';
import { buildDawn, isDawn, setDawn } from './ui/dawn';
import { dissolve } from './ui/motes';
import { LANGS, LANG_NAMES, getLang, initLang, isLang, setLang, t, type Lang } from './i18n';

export type Screen = 'intro' | 'form' | 'waiting' | 'result' | 'calm';

/** The one plain state object. Screens are rebuilt from it. */
export type State = {
  screen: Screen;
  draft: LadderDraft;
  answer: Answer | null;
  /** Steps written for the ghosts: fear text -> step text. */
  steps: Record<string, string>;
  /** Whether the "Night sound" button is on. Always false after a page load. */
  soundOn: boolean;
};

export type AppDeps = {
  analyze?: (draft: LadderDraft) => Promise<Answer>;
  store?: Storage;
  createContext?: () => AudioContext | null;
  /** The address query, like "?demo=1". Defaults to the page address. */
  search?: string;
};

const emptyDraft = (): LadderDraft => ({ goal: '', me: '', blocks: ['', '', ''], fears: [''] });

function defaultStore(): Storage | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

/** Starts the app inside `container`. */
export function mountApp(container: HTMLElement, deps: AppDeps = {}): void {
  const run = deps.analyze ?? ((d: LadderDraft) => analyze(d, undefined, undefined, getLang()));
  const store = deps.store ?? defaultStore();
  // The saved choice, or the browser language the first time. Also sets <html lang>.
  initLang(store);

  const search = deps.search ?? (typeof location !== 'undefined' ? location.search : '');
  // The demo lives in memory only. It never touches the saved draft.
  let demoActive = isDemo(search);

  const saved = store && !demoActive ? load(store) : null;
  const state: State = {
    screen: demoActive ? 'form' : 'intro',
    draft: demoActive ? demoDraft(getLang()) : saved ? saved.draft : emptyDraft(),
    answer: null,
    steps: saved ? saved.steps : {},
    soundOn: false,
  };

  // Live parts of the result screen. They exist only while it is shown.
  let heart: HeartHandle | null = null;
  let fog: FogHandle | null = null;
  let drift: DriftHandle | null = null;
  let sound: NightSound | null = null;
  let liftTimer: ReturnType<typeof setTimeout> | undefined;
  let busy = false;

  const persist = (): void => {
    if (store && !demoActive) save({ draft: state.draft, steps: state.steps }, store);
  };

  /** Stops heart, drift and sound. The fog survives when `keepFog` is set (waiting -> result). */
  function stopLive(keepFog: boolean): void {
    if (liftTimer !== undefined) clearTimeout(liftTimer);
    liftTimer = undefined;
    sound?.kill();
    sound = null;
    heart?.destroy();
    heart = null;
    drift?.destroy();
    drift = null;
    if (!keepFog) {
      fog?.destroy();
      fog = null;
    }
    state.soundOn = false;
  }

  function go(screen: Screen): void {
    state.screen = screen;
    render();
  }

  function focusHeading(root: Element): void {
    const h = root.querySelector<HTMLElement>('h1, h2');
    if (h) {
      h.tabIndex = -1;
      h.focus();
    }
  }

  function render(): void {
    stopLive(state.screen === 'result');
    if (state.screen !== 'calm') leaveCalm();
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = t('skipLink');
    switch (state.screen) {
      case 'intro':
        container.replaceChildren(createIntro(() => go('form')));
        container.querySelector<HTMLElement>('button')?.focus();
        break;
      case 'form':
        renderForm();
        break;
      case 'waiting':
        renderWaiting();
        break;
      case 'result':
        if (state.answer?.kind === 'reading') renderResult(state.answer);
        else go('intro');
        break;
      case 'calm':
        if (state.answer && state.answer.kind !== 'reading') renderCalm(state.answer);
        else go('intro');
        break;
    }
    // The EN / RU / KZ switch sits on every screen except the calm ones.
    Array.from(container.children)
      .find((c) => c.classList.contains('lang-switch'))
      ?.remove();
    if (state.screen !== 'calm') container.prepend(buildLangSwitch());
  }

  function changeLang(lang: Lang): void {
    const previous = getLang();
    // An untouched sample ladder follows the language; edited answers are never replaced.
    if (demoActive && JSON.stringify(state.draft) === JSON.stringify(demoDraft(previous))) {
      state.draft = demoDraft(lang);
    }
    setLang(lang, store);
    if (state.screen === 'result') {
      fog?.destroy();
      fog = null;
    }
    render();
  }

  function buildLangSwitch(): HTMLElement {
    const wrap = el('div', undefined, 'lang-switch');
    const select = document.createElement('select');
    select.setAttribute('aria-label', t('langLabel'));
    for (const lang of LANGS) {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = LANG_NAMES[lang];
      select.append(option);
    }
    select.value = getLang();
    select.addEventListener('change', () => {
      if (isLang(select.value)) changeLang(select.value);
    });
    wrap.append(select);
    return wrap;
  }

  function startOver(): void {
    demoActive = false;
    if (store) clear(store);
    state.draft = emptyDraft();
    state.steps = {};
    state.answer = null;
    go('intro');
  }

  function renderForm(): void {
    container.replaceChildren(
      createForm({
        draft: state.draft,
        onChange: (d) => {
          state.draft = d;
          persist();
        },
        onSubmit: (d) => {
          state.draft = d;
          persist();
          void submit();
        },
        onClear: startOver,
        demo: demoActive,
        onDemoClear: () => {
          // Leave the demo without touching anything saved in the browser.
          demoActive = false;
          state.draft = emptyDraft();
          state.steps = {};
          state.answer = null;
          go('form');
        },
      }),
    );
  }

  function renderWaiting(): void {
    const root = el('section', undefined, 'screen waiting');
    const status = el('p', t('waiting'), 'waiting-note');
    status.setAttribute('role', 'status');
    const stage = el('div', undefined, 'stage waiting-stage');
    fog = buildFog();
    stage.append(fog.element);
    root.append(status, stage);
    container.replaceChildren(root);
    root.setAttribute('tabindex', '-1');
    root.focus();
  }

  /** "Show my ladder": validate, wait behind the fog, then route the answer. */
  async function submit(): Promise<void> {
    if (busy) return;
    if (!validateDraft(state.draft).ok) {
      go('form');
      return;
    }
    busy = true;
    go('waiting');
    let answer: Answer;
    try {
      answer = await run(state.draft);
    } catch {
      answer = { kind: 'error', reason: 'network' };
    }
    busy = false;
    state.answer = answer;
    if (answer.kind === 'reading') go('result');
    else go('calm');
  }

  function renderCalm(answer: CalmAnswer): void {
    const crisis = answer.kind === 'crisis';
    if (crisis) {
      state.draft = emptyDraft();
      state.steps = {};
    }
    showCalm(container, answer, {
      kill: () => sound?.kill(),
      store,
      onBack: () => {
        if (crisis) {
          state.answer = null;
          go('intro');
        } else {
          go('form');
        }
      },
      onRetry: answer.kind === 'error' ? () => void submit() : undefined,
    });
    container.querySelector<HTMLElement>('.calm-screen')?.setAttribute('tabindex', '-1');
    container.querySelector<HTMLElement>('.calm-screen')?.focus();
  }

  function renderResult(reading: Reading): void {
    const ghosts: Ghost[] = applySavedSteps(ghostsFromReading(reading), state.steps);
    const root = el('section', undefined, 'screen result');
    root.append(el('h2', t('resultTitle')));

    const stage = el('div', undefined, 'stage');
    root.append(stage);
    // Attach first so the staircase can be drawn for the real width (phone or wide).
    container.replaceChildren(root);
    const h = buildHeart(ghosts);
    heart = h;
    const svg = buildStaircase(reading, ghosts, { width: stage.clientWidth });
    const dawn = buildDawn();
    stage.append(dawn.sky, h.element, svg, dawn.line);
    setDawn(stage, isDawn(ghosts));
    const activeFog = fog;
    if (activeFog) {
      dimForWaiting(svg);
      stage.append(activeFog.element);
    }
    drift = attachGhostDrift(svg);

    const night = createNightSound({
      getBeatSeconds: () => readBeatSeconds(h.element),
      createContext: deps.createContext,
    });
    sound = night;
    const toggle = buildSoundToggle(night, store);
    toggle.element.addEventListener('click', () => {
      state.soundOn = toggle.element.getAttribute('aria-pressed') === 'true';
    });
    const soundRow = el('p', undefined, 'sound-row');
    soundRow.append(toggle.element);

    const message = el('p', '', 'save-message');
    message.setAttribute('role', 'alert');

    const wasFaded = ghosts.map((g) => isFaded(g));
    const readingEl = buildReading(reading, ghosts, {
      onStepsChange: (gs) => {
        state.steps = stepsRecord(gs);
        persist();
        updateGhosts(svg, gs);
        h.update(gs);
        const dawnNow = isDawn(gs);
        setDawn(stage, dawnNow);
        gs.forEach((g, i) => {
          const now = isFaded(g);
          if (now && wasFaded[i] === false) {
            dissolve(svg, i, dawnNow ? 'sun' : 'moon');
            night.chime();
          }
          wasFaded[i] = now;
        });
      },
      onSave: () => {
        // The picture always uses the wide layout, so the written steps fit under it.
        void saveLadderImage(buildStaircase(reading, ghosts), ghosts).then((r) => {
          message.textContent = r.ok ? '' : r.message;
        });
      },
    });
    readingEl.addEventListener('focusin', (e) => {
      const wrap = (e.target as HTMLElement).closest<HTMLElement>('.ghost-step');
      const index = wrap ? Number(wrap.dataset['ghost']) : NaN;
      drift?.focusGhost(Number.isFinite(index) ? index : null);
    });
    readingEl.addEventListener('focusout', () => drift?.focusGhost(null));

    const back = el('button', t('editAnswers'), 'secondary');
    back.type = 'button';
    back.addEventListener('click', () => go('form'));
    const nav = el('div', undefined, 'nav');
    nav.append(back);

    root.append(soundRow, readingEl, message, nav);
    focusHeading(root);

    if (activeFog) {
      liftTimer = setTimeout(() => {
        liftTimer = undefined;
        activeFog.lift(svg);
      }, 30);
    }
  }

  render();
}

const app = document.getElementById('app');
if (app) mountApp(app);
