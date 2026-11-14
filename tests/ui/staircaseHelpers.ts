import type { Reading } from '../../src/domain/server';
import { charWidth, NOTE_FONT, CARD_PAD, GHOST_ROOM, CARD_H } from '../../src/ui/staircase';

export function lum(hex: string): number {
  const ch = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (ch[0] ?? 0) + 0.7152 * (ch[1] ?? 0) + 0.0722 * (ch[2] ?? 0);
}

export function contrast(a: string, b: string): number {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function readingWith(blocks: string[], fears: string[]): Reading {
  return {
    kind: 'reading',
    steps: [
      { number: 1, zone: 'current', zoneLabel: 'I', text: 'Here' },
      ...blocks.map((b, i) => ({ number: 2 + i, zone: 'block' as const, zoneLabel: 'Block', text: b })),
      { number: 2 + blocks.length, zone: 'goal', zoneLabel: 'Goal', text: 'Goal' },
      ...fears.map((f, i) => ({
        number: 3 + blocks.length + i,
        zone: 'fear' as const,
        zoneLabel: 'Fear',
        text: f,
      })),
    ],
    nearestBlock: blocks[0] ?? null,
    fearsAboveGoal: fears.length,
    insights: [],
    questions: [],
    fullDiagnostic: { text: 't', url: 'https://108psy.com/' },
    author: 'a',
    disclaimer: 'd',
  };
}

export type Box = { left: number; right: number; top: number; bottom: number };

export const overlaps = (a: Box, b: Box): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

export const attr = (node: Element | null | undefined, name: string): number =>
  Number(node?.getAttribute(name));

export function rectBox(node: Element | null | undefined): Box {
  const x = attr(node, 'x');
  const y = attr(node, 'y');
  return { left: x, right: x + attr(node, 'width'), top: y, bottom: y + attr(node, 'height') };
}

export function lineTexts(label: Element): string[] {
  return Array.from(label.querySelectorAll('tspan')).map((s) => s.textContent ?? '');
}

/** Box of a note text from its x, y and wrapped lines (font size 13, line height 1.25). */
export function textBox(label: Element): Box {
  const lines = lineTexts(label);
  const size = attr(label, 'font-size');
  const x = attr(label, 'x');
  const y = attr(label, 'y');
  const widest = Math.max(...lines.map((l) => l.length));
  return {
    left: x,
    right: x + widest * charWidth(size),
    top: y - size,
    bottom: y + (lines.length - 1) * size * 1.25 + 3,
  };
}

export type Parts = {
  stair: Element;
  plate: Element;
  note: Element;
  /** The words of this step: a step label, or the label of the step's ghost. */
  label: Element;
  zone: string;
};

/** Every plate with its card and text, in drawing order. Works for fear steps through their ghost. */
export function partsOf(svg: SVGSVGElement): Parts[] {
  return Array.from(svg.querySelectorAll('.stair')).map((stair) => {
    const plate = stair.querySelector('rect.plate');
    const note = stair.querySelector('rect.note');
    if (!plate || !note) throw new Error('plate or note missing');
    const zone = stair.getAttribute('data-zone') ?? '';
    let label: Element | null = stair.querySelector('text.step-label');
    if (zone === 'fear') {
      const gi = plate.getAttribute('data-ghost');
      label = svg.querySelector(`.ghost[data-ghost="${gi}"] text.ghost-label`);
    }
    if (!label) throw new Error('label missing');
    return { stair, plate, note, label, zone };
  });
}

/** The text fits its card: inside the card on every side, and not on the ghost's room. */
export function textFitsCard(label: Element, note: Element, zone: string): boolean {
  const box = textBox(label);
  const card = rectBox(note);
  const size = attr(label, 'font-size');
  if (size < NOTE_FONT) return false;
  const minLeft = card.left + CARD_PAD + (zone === 'fear' ? GHOST_ROOM : 0);
  return (
    box.left >= minLeft &&
    box.right <= card.right - CARD_PAD + 0.001 &&
    box.top >= card.top &&
    box.bottom <= card.top + CARD_H
  );
}
