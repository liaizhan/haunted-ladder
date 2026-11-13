// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { buildStaircase } from '../../src/ui/staircase';
import { buildExportSvg, CREDIT_LINE } from '../../src/ui/exportImage';
import { ghostsFromReading } from '../../src/domain/ghosts';
import type { Reading } from '../../src/domain/server';

const reading: Reading = {
  kind: 'reading',
  steps: [
    { number: 1, zone: 'current', zoneLabel: 'I', text: 'Here' },
    { number: 2, zone: 'block', zoneLabel: 'Block', text: 'Dad: no' },
    { number: 3, zone: 'goal', zoneLabel: 'Goal', text: 'Goal' },
    { number: 4, zone: 'fear', zoneLabel: 'Fear', text: 'They will laugh' },
  ],
  nearestBlock: 'Dad: no',
  fearsAboveGoal: ['They will laugh'],
  insights: [],
  questions: [],
  fullDiagnostic: { text: 't', url: 'https://108psy.com/' },
  author: 'a',
  disclaimer: 'd',
};

describe('exportImage', () => {
  it('adds the credit line, written steps and a background, and keeps the fade', () => {
    const ghosts = ghostsFromReading(reading);
    const first = ghosts[0];
    if (first) first.step = 'Record one <b>video</b>';
    const svg = buildStaircase(reading, ghosts);
    const before = svg.outerHTML;
    const copy = buildExportSvg(svg, ghosts);
    const texts = Array.from(copy.querySelectorAll('text')).map((t) => t.textContent);
    expect(texts).toContain(CREDIT_LINE);
    expect(texts.join(' ')).toContain('Record one <b>video</b>');
    expect(copy.querySelector('b')).toBeNull();
    expect(copy.querySelector('.ghost')?.getAttribute('opacity')).toBe('0.15');
    expect(copy.firstElementChild?.tagName.toLowerCase()).toBe('rect');
    expect(svg.outerHTML).toBe(before);
  });
});
