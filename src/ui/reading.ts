import type { Reading } from '../domain/server';
import { rewriteUtm } from '../domain/server';
import { allFaded, isFaded, type Ghost } from '../domain/ghosts';

export type ReadingOptions = {
  /** Called after every change to a step field. The ghosts array is already updated. */
  onStepsChange: (ghosts: Ghost[]) => void;
  /** Called when the person presses "Save my ladder". */
  onSave: () => void;
};

export const CLOSING_LINE =
  'Every ghost has a name and a next step now. That is a real way to make a fear smaller.';

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

function list(items: string[], className: string): HTMLUListElement {
  const ul = el('ul', undefined, className);
  for (const item of items) ul.append(el('li', item));
  return ul;
}

/**
 * Builds the reading: insights, two questions, one step field per ghost,
 * the closing line and "Save my ladder", the disclaimer and the diagnostic link.
 * The `ghosts` array is updated in place as the person types. Server and person text
 * is set with textContent only.
 */
export function buildReading(
  reading: Reading,
  ghosts: Ghost[],
  opts: ReadingOptions,
): HTMLElement {
  const root = el('section', undefined, 'reading');

  if (reading.insights.length > 0) {
    root.append(el('h2', 'What your ladder shows'), list(reading.insights, 'insights'));
  }
  if (reading.questions.length > 0) {
    root.append(el('h2', 'Two questions to think about'), list(reading.questions, 'questions'));
  }

  const closing = el('p', CLOSING_LINE, 'closing');
  closing.setAttribute('role', 'status');
  const save = el('button', 'Save my ladder', 'save');
  save.type = 'button';

  const refresh = (): void => {
    const done = allFaded(ghosts);
    closing.hidden = !done || ghosts.length === 0;
    save.disabled = !done;
  };

  if (ghosts.length > 0) {
    root.append(
      el('h2', 'Make the ghosts smaller'),
      el('p', 'A fear becomes smaller when it has a name and a next step.', 'help'),
    );
    const steps = el('div', undefined, 'ghost-steps');
    ghosts.forEach((g, i) => {
      const id = `ghost-step-${i}`;
      const wrap = el('div', undefined, 'field ghost-step');
      wrap.dataset['ghost'] = String(i);
      const label = el('label', undefined);
      label.htmlFor = id;
      label.append(el('span', 'My small step this week', 'step-label'));
      label.append(el('span', ` for the fear: ${g.fear}`, 'step-fear'));
      const input = el('input');
      input.type = 'text';
      input.id = id;
      input.value = g.step;
      input.autocomplete = 'off';
      const mark = el('span', '', 'step-mark');
      mark.setAttribute('aria-hidden', 'true');
      const sync = (): void => {
        const faded = isFaded(g);
        mark.textContent = faded ? '✓' : '';
        wrap.classList.toggle('faded', faded);
      };
      input.addEventListener('input', () => {
        g.step = input.value;
        sync();
        refresh();
        opts.onStepsChange(ghosts);
      });
      sync();
      wrap.append(label, input, mark);
      steps.append(wrap);
    });
    root.append(steps, closing);
  }

  save.addEventListener('click', () => {
    if (!save.disabled) opts.onSave();
  });
  refresh();
  root.append(save);

  root.append(el('p', reading.disclaimer, 'disclaimer'));

  const link = el('a', reading.fullDiagnostic.text, 'diagnostic');
  link.href = rewriteUtm(reading.fullDiagnostic.url);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  root.append(el('p', undefined, 'diagnostic-line'));
  root.lastElementChild?.append(link);

  return root;
}
