import type { Reading } from '../domain/server';
import { rewriteUtm } from '../domain/server';
import { allFaded, isFaded, type Ghost } from '../domain/ghosts';
import { en } from '../locales/en';
import { t } from '../i18n';

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

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Opacity of a step field's ghost icon once its ghost has a step. Same as the staircase ghost. */
export const ICON_FADED_OPACITY = 0.15;

/** Small decorative ghost shown next to a step field. Its opacity follows the ghost. */
function buildGhostIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'step-ghost-icon');
  svg.setAttribute('viewBox', '-30 -52 60 88');
  svg.setAttribute('width', '28');
  svg.setAttribute('height', '40');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const body = document.createElementNS(SVG_NS, 'path');
  body.setAttribute(
    'd',
    'M-26 0 C-26 -34 -14 -48 0 -48 C14 -48 26 -34 26 0 L26 30 L17 22 L9 30 L0 22 L-9 30 L-17 22 L-26 30 Z',
  );
  body.setAttribute('fill', '#F4EFE6');
  body.setAttribute('fill-opacity', '0.85');
  svg.append(body);
  for (const cx of [-9, 9]) {
    const eye = document.createElementNS(SVG_NS, 'circle');
    eye.setAttribute('cx', String(cx));
    eye.setAttribute('cy', '-22');
    eye.setAttribute('r', '3.5');
    eye.setAttribute('fill', '#221C45');
    svg.append(eye);
  }
  return svg;
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
    block.append(
      el('h2', t('ghostBlockTitle')),
      el('p', t('ghostBlockHelp'), 'help'),
    );
    const steps = el('div', undefined, 'ghost-steps');
    ghosts.forEach((g, i) => {
      const id = `ghost-step-${i}`;
      const wrap = el('div', undefined, 'field ghost-step');
      wrap.dataset['ghost'] = String(i);
      const head = el('div', undefined, 'step-head');
      const icon = buildGhostIcon();
      const label = el('label', undefined);
      label.htmlFor = id;
      label.append(el('span', t('stepLabel'), 'step-label'));
      label.append(el('span', ` ${t('stepFor', { fear: g.fear })}`, 'step-fear'));
      head.append(icon, label);
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
        icon.setAttribute('opacity', String(faded ? ICON_FADED_OPACITY : 1));
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
