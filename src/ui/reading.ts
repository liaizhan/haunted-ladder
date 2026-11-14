import type { Reading } from '../domain/server';
import { rewriteUtm } from '../domain/server';
import { allFaded, isFaded, type Ghost } from '../domain/ghosts';
import { en } from '../locales/en';
import { t } from '../i18n';
import { htmlArt, type ArtName } from './art';

export type ReadingOptions = {
  /** Called after every change to a step field. The ghosts array is already updated. */
  onStepsChange: (ghosts: Ghost[]) => void;
  /** Called when the person presses "Save my ladder". */
  onSave: () => void;
};

/** The English closing line. The screen itself shows `t('closingLine')`. */
export const CLOSING_LINE = en.closingLine;

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
 * A small round medallion next to a step field. A Zheztyrnaq looks out of it; once the
 * field has a step she turns into a Peri, the gold ring lights up and flashes once.
 */
function buildGhostIcon(): HTMLSpanElement {
  const icon = el('span', undefined, 'step-ghost-icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.append(htmlArt('zheztyrnaq', 'step-ghost-dark', 52), htmlArt('peri', 'step-ghost-light', 52));
  return icon;
}

/** The seven pictures of the legend, in the order shown, with their dictionary keys. */
export const LEGEND_ITEMS = [
  { art: 'zheztyrnaq', key: 'legendZheztyrnaq' },
  { art: 'peri', key: 'legendPeri' },
  { art: 'shanyraq', key: 'legendShanyraq' },
  { art: 'asyq', key: 'legendAsyq' },
  { art: 'tumar', key: 'legendTumar' },
  { art: 'qobyz', key: 'legendQobyz' },
  { art: 'burkit', key: 'legendBurkit' },
] as const satisfies ReadonlyArray<{ art: ArtName; key: string }>;

/** "Who lives on this ladder": each picture (48 px) with one sentence in the chosen language. */
export function buildLegend(): HTMLElement {
  const root = el('section', undefined, 'legend');
  root.setAttribute('aria-labelledby', 'legend-title');
  const title = el('h2', t('legendTitle'));
  title.id = 'legend-title';
  const list = el('ul', undefined, 'legend-list');
  for (const item of LEGEND_ITEMS) {
    const li = el('li', undefined, 'legend-item');
    li.append(htmlArt(item.art, 'legend-art', 48), el('p', t(item.key)));
    list.append(li);
  }
  root.append(title, list);
  return root;
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

  const closing = el('p', t('closingLine'), 'closing');
  closing.setAttribute('role', 'status');
  const save = el('button', t('saveLadder'), 'save');
  save.type = 'button';

  const refresh = (): void => {
    const done = allFaded(ghosts);
    closing.hidden = !done || ghosts.length === 0;
    save.disabled = !done;
  };

  // The ghost-steps block comes first so it sits right after the staircase on a phone
  // and beside it on a wide screen.
  const block = el('div', undefined, 'ghost-block');
  root.append(block);

  if (ghosts.length > 0) {
    const heading = el('h2', undefined, 'ghost-heading');
    heading.append(htmlArt('qobyz', 'emblem-qobyz', 28), el('span', t('ghostBlockTitle')));
    block.append(heading, el('p', t('ghostBlockHelp'), 'help'));
    const steps = el('div', undefined, 'ghost-steps');
    ghosts.forEach((g, i) => {
      const id = `ghost-step-${i}`;
      const wrap = el('div', undefined, 'field ghost-step');
      wrap.dataset['ghost'] = String(i);
      const head = el('div', undefined, 'step-head');
      const icon = buildGhostIcon();
      const label = el('label', undefined);
      label.htmlFor = id;
      // The fear itself comes first and large, "my step this week" below it, small.
      label.append(el('span', t('stepFor', { fear: g.fear }), 'step-fear'));
      label.append(el('span', t('stepLabel'), 'step-label'));
      head.append(icon, label);
      const input = el('input');
      input.type = 'text';
      input.id = id;
      input.value = g.step;
      input.autocomplete = 'off';
      input.placeholder = t('stepPlaceholder');
      const mark = el('span', '', 'step-mark');
      mark.setAttribute('aria-hidden', 'true');
      const sync = (): void => {
        const faded = isFaded(g);
        mark.textContent = faded ? '✓' : '';
        wrap.classList.toggle('faded', faded);
        icon.classList.toggle('turned', faded);
      };
      input.addEventListener('input', () => {
        g.step = input.value;
        sync();
        refresh();
        opts.onStepsChange(ghosts);
      });
      sync();
      wrap.append(head, input, mark);
      steps.append(wrap);
    });
    block.append(steps, closing);
  }

  save.addEventListener('click', () => {
    if (!save.disabled) opts.onSave();
  });
  refresh();
  block.append(save);

  if (reading.insights.length > 0) {
    root.append(el('h2', t('insightsTitle')), list(reading.insights, 'insights'));
  }
  if (reading.questions.length > 0) {
    root.append(el('h2', t('questionsTitle')), list(reading.questions, 'questions'));
  }

  root.append(el('p', reading.disclaimer, 'disclaimer'));

  const link = el('a', reading.fullDiagnostic.text, 'diagnostic');
  link.href = rewriteUtm(reading.fullDiagnostic.url);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  root.append(el('p', undefined, 'diagnostic-line'));
  root.lastElementChild?.append(link);

  return root;
}
