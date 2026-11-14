import {
  MAX_BLOCKS,
  MAX_FEARS,
  MAX_PHRASE,
  MIN_BLOCKS,
  validatePhrase,
  type LadderDraft,
} from '../domain/ladder';
import { t, type Key } from '../i18n';

export type FormOptions = {
  /** Starting values (a saved draft or the demo). */
  draft: LadderDraft;
  /** Called after every change, so the caller can save the draft. */
  onChange: (draft: LadderDraft) => void;
  /** Called when the person presses "Show my ladder" with a valid draft. */
  onSubmit: (draft: LadderDraft) => void;
  /** Called when the person presses "Clear my answers". */
  onClear: () => void;
  /** Demo mode: open on the last screen and show the sample line. */
  demo?: boolean;
  /** Called when the person presses "Clear" on the demo line. */
  onDemoClear?: () => void;
};

type StepKey = 'goal' | 'me' | 'blocks' | 'fears';
const STEPS: StepKey[] = ['goal', 'me', 'blocks', 'fears'];

const TITLES: Record<StepKey, Key> = {
  goal: 'qGoalTitle',
  me: 'qMeTitle',
  blocks: 'qBlocksTitle',
  fears: 'qFearsTitle',
};

const HELP: Record<StepKey, Key> = {
  goal: 'qGoalHelp',
  me: 'qMeHelp',
  blocks: 'qBlocksHelp',
  fears: 'qFearsHelp',
};

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

/**
 * A section that runs a callback when it is attached to the page, so focus can
 * move into the screen at the moment it appears (focus() does nothing on a
 * detached node).
 */
class FormScreen extends HTMLElement {
  onAttach?: () => void;
  connectedCallback(): void {
    this.onAttach?.();
  }
}
if (!customElements.get('form-screen')) customElements.define('form-screen', FormScreen);

function hintFor(text: string, optionalEmpty: boolean): string {
  if (optionalEmpty && text.trim().length === 0) return '';
  const e = validatePhrase(text);
  if (e === 'empty') return t('hintEmpty');
  if (e === 'tooLong') return t('hintTooLong', { max: MAX_PHRASE });
  return '';
}

/** The questions screen: one question per screen, live hints, draft saved on every change. */
export function createForm(opts: FormOptions): HTMLElement {
  const draft: LadderDraft = {
    goal: opts.draft.goal,
    me: opts.draft.me,
    blocks: [...opts.draft.blocks],
    fears: [...opts.draft.fears],
  };
  while (draft.blocks.length < MIN_BLOCKS) draft.blocks.push('');
  if (draft.blocks.length > MAX_BLOCKS) draft.blocks.length = MAX_BLOCKS;
  if (draft.fears.length === 0) draft.fears.push('');
  if (draft.fears.length > MAX_FEARS) draft.fears.length = MAX_FEARS;

  let step = opts.demo ? STEPS.length - 1 : 0;

  const root = document.createElement('form-screen') as FormScreen;
  root.className = 'screen form';
  let counter = 0;

  const emit = (): void =>
    opts.onChange({
      goal: draft.goal,
      me: draft.me,
      blocks: [...draft.blocks],
      fears: [...draft.fears],
    });

  const isStepValid = (key: StepKey): boolean => {
    switch (key) {
      case 'goal':
        return validatePhrase(draft.goal) === null;
      case 'me':
        return validatePhrase(draft.me) === null;
      case 'blocks':
        return (
          draft.blocks.length >= MIN_BLOCKS &&
          draft.blocks.every((b) => validatePhrase(b) === null)
        );
      case 'fears':
        return draft.fears.every(
          (f) => f.trim().length === 0 || validatePhrase(f) === null,
        );
    }
  };

  function render(focusIndex?: number): void {
    root.replaceChildren();
    const key = STEPS[step] ?? 'goal';
    const last = step === STEPS.length - 1;

    if (opts.demo) {
      const demo = el('p', `${t('demoNote')} `, 'demo-note');
      const clearDemo = el('button', t('demoClear'));
      clearDemo.type = 'button';
      clearDemo.addEventListener('click', () => opts.onDemoClear?.());
      demo.append(clearDemo);
      root.append(demo);
    }

    root.append(el('p', t('progress', { n: step + 1, total: STEPS.length }), 'progress'));
    const title = el('h2', t(TITLES[key]));
    title.tabIndex = -1;
    root.append(title, el('p', t(HELP[key]), 'help'));

    const next = el('button', last ? t('showLadder') : t('next'));
    next.type = 'button';
    const updateNext = (): void => {
      next.disabled = !isStepValid(key);
    };

    const makeField = (
      label: string,
      value: string,
      optional: boolean,
      onInput: (v: string) => void,
    ): { wrap: HTMLElement; input: HTMLInputElement } => {
      const id = `field-${++counter}`;
      const wrap = el('div', undefined, 'field');
      const lab = el('label', label);
      lab.htmlFor = id;
      const input = el('input');
      input.type = 'text';
      input.id = id;
      input.value = value;
      input.autocomplete = 'off';
      const hint = el('p', hintFor(value, optional), 'hint');
      hint.id = `${id}-hint`;
      input.setAttribute('aria-describedby', hint.id);
      input.setAttribute('aria-invalid', hint.textContent ? 'true' : 'false');
      input.addEventListener('input', () => {
        onInput(input.value);
        hint.textContent = hintFor(input.value, optional);
        input.setAttribute('aria-invalid', hint.textContent ? 'true' : 'false');
        emit();
        updateNext();
      });
      wrap.append(lab, input, hint);
      return { wrap, input };
    };

    let firstInput = null as HTMLInputElement | null;
    const notice = el('p', '', 'limit-note');
    notice.setAttribute('role', 'status');

    if (key === 'goal' || key === 'me') {
      const f = makeField(
        key === 'goal' ? t('fieldGoal') : t('fieldMe'),
        draft[key],
        false,
        (v) => {
          draft[key] = v;
        },
      );
      firstInput = f.input;
      root.append(f.wrap);
    } else {
      const list = key === 'blocks' ? draft.blocks : draft.fears;
      const max = key === 'blocks' ? MAX_BLOCKS : MAX_FEARS;
      const min = key === 'blocks' ? MIN_BLOCKS : 0;
      const isBlocks = key === 'blocks';
      const rows = el('div', undefined, 'rows');
      let focusTarget = null as HTMLInputElement | null;

      list.forEach((value, i) => {
        const row = el('div', undefined, 'row');
        const f = makeField(
          t(isBlocks ? 'fieldObstacle' : 'fieldFear', { n: i + 1 }),
          value,
          key === 'fears',
          (v) => {
            list[i] = v;
          },
        );
        row.append(f.wrap);
        if (i === 0 && !firstInput) firstInput = f.input;
        if (i === focusIndex) focusTarget = f.input;
        const canRemove = list.length > Math.max(min, key === 'fears' ? 1 : 0);
        if (canRemove) {
          const rm = el('button', t('remove'), 'secondary');
          rm.type = 'button';
          rm.setAttribute(
            'aria-label',
            t(isBlocks ? 'removeObstacleAria' : 'removeFearAria', { n: i + 1 }),
          );
          rm.addEventListener('click', () => {
            list.splice(i, 1);
            emit();
            render(Math.max(0, i - 1));
          });
          row.append(rm);
        }
        rows.append(row);
      });
      root.append(rows);

      const add = el('button', t(isBlocks ? 'addObstacle' : 'addFear'), 'secondary');
      add.type = 'button';
      add.addEventListener('click', () => {
        if (list.length >= max) {
          notice.textContent = t('limit', { max });
          return;
        }
        list.push('');
        emit();
        render(list.length - 1);
      });
      root.append(add, notice);
      if (list.length >= max) notice.textContent = t('limit', { max });
      if (focusTarget) firstInput = focusTarget;
    }

    const nav = el('div', undefined, 'nav');
    if (step > 0) {
      const back = el('button', t('back'), 'secondary');
      back.type = 'button';
      back.addEventListener('click', () => {
        step -= 1;
        render();
      });
      nav.append(back);
    }
    next.addEventListener('click', () => {
      if (!isStepValid(key)) return;
      if (last) {
        opts.onSubmit({
          goal: draft.goal,
          me: draft.me,
          blocks: [...draft.blocks],
          fears: [...draft.fears],
        });
      } else {
        step += 1;
        render();
      }
    });
    updateNext();
    nav.append(next);
    root.append(nav);

    const clear = el('button', t('clearAnswers'), 'secondary clear');
    clear.type = 'button';
    clear.addEventListener('click', () => opts.onClear());
    root.append(clear);

    const toFocus: HTMLElement = firstInput ?? title;
    toFocus.focus();
    pendingFocus = toFocus;
  }

  let pendingFocus: HTMLElement | null = null;
  root.onAttach = () => pendingFocus?.focus();

  render();
  return root;
}
