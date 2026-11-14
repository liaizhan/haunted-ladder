import type { Crisis, Failure, Health } from '../domain/server';
import { clear } from '../domain/storage';
import { en } from '../locales/en';
import { t } from '../i18n';

export type CalmAnswer = Crisis | Health | Failure;

export type CalmOptions = {
  /** Crisis: "Back to the start". Health and error: "Edit answers". */
  onBack: () => void;
  /** Error only: "Try again" re-sends the same draft. */
  onRetry?: () => void;
  /** Stops all sound at once (nightSound.kill). Called before anything is drawn. */
  kill?: () => void;
  /** Where the saved draft lives. Defaults to localStorage when it exists. */
  store?: Storage;
};

/** Classes of every spooky layer. None of them may exist on a calm screen. */
export const SPOOKY_SELECTOR = '.stair, .ghost, .cobweb, .moon, .fog, .heart, .night-sound';

/** The English error text. The screen itself shows `t('errorMessage')`. */
export const ERROR_MESSAGE = en.errorMessage;

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

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

function safeHref(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Removes the calm theme from the page. Call before going back to a normal screen. */
export function leaveCalm(): void {
  document.body.classList.remove('calm');
}

/**
 * Builds a calm screen: crisis, health or error. Pure DOM, no side effects.
 * Text from the server is set with textContent only, exactly as sent.
 */
export function buildCalm(answer: CalmAnswer, opts: CalmOptions): HTMLElement {
  const root = el('section', undefined, 'calm-screen');
  root.setAttribute('role', 'alert');
  const back = (): void => {
    leaveCalm();
    opts.onBack();
  };

  if (answer.kind === 'crisis') {
    root.append(el('p', answer.message, 'calm-message'));
    const href = safeHref(answer.helpUrl);
    const line = el('p', undefined, 'calm-help');
    if (href) {
      const a = el('a', answer.helpUrl);
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      line.append(a);
    } else {
      line.textContent = answer.helpUrl;
    }
    root.append(line, button(t('crisisBack'), back));
  } else if (answer.kind === 'health') {
    root.append(el('p', answer.message, 'calm-message'), button(t('calmEdit'), back));
  } else {
    root.append(el('p', t('errorMessage'), 'calm-message'));
    const actions = el('div', undefined, 'nav');
    const retry = opts.onRetry;
    if (retry) {
      actions.append(
        button(t('tryAgain'), () => {
          leaveCalm();
          retry();
        }),
      );
    }
    const edit = button(t('calmEdit'), back);
    if (retry) edit.className = 'secondary';
    actions.append(edit);
    root.append(actions);
  }
  return root;
}

/**
 * Shows a calm screen in `container`: stops sound, adds `calm` to body, removes every
 * spooky element from the page, and (crisis only) deletes the saved draft.
 */
export function showCalm(container: HTMLElement, answer: CalmAnswer, opts: CalmOptions): void {
  opts.kill?.();
  container.replaceChildren();
  document.body.classList.add('calm');
  for (const node of Array.from(document.querySelectorAll(SPOOKY_SELECTOR))) node.remove();
  if (answer.kind === 'crisis') {
    const store = opts.store ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    if (store) clear(store);
  }
  container.append(buildCalm(answer, opts));
}
