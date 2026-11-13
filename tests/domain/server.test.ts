import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseAnswer, rewriteUtm } from '../../src/domain/server';
import realReading from '../fixtures/real-reading.json';

const RUNS = { numRuns: 100 };

const validReading = {
  kind: 'reading',
  steps: [
    { number: 1, zone: 'current', zoneLabel: 'I', text: 'a' },
    { number: 2, zone: 'block', zoneLabel: 'Block', text: 'b' },
    { number: 3, zone: 'goal', zoneLabel: 'Goal', text: 'c' },
    { number: 4, zone: 'fear', zoneLabel: 'Fear', text: 'd' },
  ],
  nearestBlock: 'b',
  fearsAboveGoal: 1,
  insights: ['i'],
  questions: ['q1', 'q2'],
  fullDiagnostic: { text: 't', url: 'https://108psy.com/x?utm_source=chatgpt_plugin' },
  author: 'Aizhan Li',
  disclaimer: 'Not therapy.',
};

describe('server domain', () => {
  // Feature: haunted-ladder, Property 4: Parsing never throws and never invents a reading
  it('Property 4: never throws on any JSON value', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (v) => {
        const a = parseAnswer(v);
        expect(['reading', 'crisis', 'health', 'error']).toContain(a.kind);
        if (a.kind === 'reading') {
          expect(Array.isArray(a.steps)).toBe(true);
          expect(a.questions.every((q) => typeof q === 'string')).toBe(true);
        }
      }),
      RUNS,
    );
    expect(() => parseAnswer(undefined)).not.toThrow();
    expect(() => parseAnswer(null)).not.toThrow();
  });

  // Feature: haunted-ladder, Property 4: Parsing never throws and never invents a reading
  it('Property 4: wrapped random payloads are never a reading', () => {
    fc.assert(
      fc.property(fc.jsonValue(), fc.string(), (v, s) => {
        for (const raw of [
          { result: { structuredContent: v } },
          { result: { content: [{ type: 'text', text: s }] } },
          { result: { content: [{ type: 'text', text: JSON.stringify(v) }] } },
        ]) {
          const a = parseAnswer(raw);
          expect(a.kind === 'reading').toBe(false);
        }
      }),
      RUNS,
    );
  });

  // Feature: haunted-ladder, Property 4: Parsing never throws and never invents a reading
  it('Property 4: a reading missing any required field is an error', () => {
    for (const key of Object.keys(validReading)) {
      if (key === 'kind' || key === 'nearestBlock' || key === 'fearsAboveGoal') continue;
      const broken: Record<string, unknown> = { ...validReading };
      delete broken[key];
      expect(parseAnswer({ result: { structuredContent: broken } })).toEqual({
        kind: 'error',
        reason: 'shape',
      });
    }
  });

  it('parses reading, crisis, health, fallback text and rpc error', () => {
    const r = parseAnswer({ result: { structuredContent: validReading } });
    expect(r.kind).toBe('reading');
    if (r.kind === 'reading') {
      expect(r.steps).toHaveLength(4);
      expect(r.nearestBlock).toBe('b');
    }

    const viaText = parseAnswer({
      result: { content: [{ type: 'text', text: JSON.stringify(validReading) }] },
    });
    expect(viaText.kind).toBe('reading');

    expect(
      parseAnswer({ result: { structuredContent: { kind: 'crisis', message: 'm', helpUrl: 'https://h' } } }),
    ).toEqual({ kind: 'crisis', message: 'm', helpUrl: 'https://h' });
    expect(
      parseAnswer({ result: { structuredContent: { kind: 'health', message: 'm', helpUrl: null } } }),
    ).toEqual({ kind: 'health', message: 'm' });
    expect(parseAnswer({ error: { code: -1, message: 'x' } })).toEqual({ kind: 'error', reason: 'rpc' });
    expect(parseAnswer({ result: { content: [{ text: '{broken' }] } })).toEqual({
      kind: 'error',
      reason: 'shape',
    });
  });

  it('contract: the real server reading parses', () => {
    const a = parseAnswer(realReading);
    expect(a.kind).toBe('reading');
    if (a.kind === 'reading') {
      expect(a.steps).toHaveLength(8);
      expect(a.fearsAboveGoal).toBe(3);
      expect(a.questions).toHaveLength(2);
      expect(a.fullDiagnostic.url).toMatch(/^https:\/\//);
    }
  });

  it('fearsAboveGoal: missing is 0; negative, non-finite or non-number is a shape error', () => {
    const without: Record<string, unknown> = { ...validReading };
    delete without['fearsAboveGoal'];
    const ok = parseAnswer({ result: { structuredContent: without } });
    expect(ok.kind === 'reading' && ok.fearsAboveGoal).toBe(0);
    for (const bad of [-1, ['d'], '3', null, { a: 1 }]) {
      expect(
        parseAnswer({ result: { structuredContent: { ...validReading, fearsAboveGoal: bad } } }),
      ).toEqual({ kind: 'error', reason: 'shape' });
    }
  });

  // Feature: haunted-ladder, Property 8: UTM rewrite
  it('Property 8: rewriteUtm changes only utm_source=chatgpt_plugin', () => {
    const seg = fc.stringMatching(/^[a-z0-9]{1,8}$/);
    const param = fc
      .tuple(seg, seg)
      .filter(([k]) => k !== 'utm_source')
      .map(([k, v]) => `${k}=${v}`);
    fc.assert(
      fc.property(
        seg,
        fc.array(seg, { maxLength: 3 }),
        fc.array(param, { maxLength: 3 }),
        fc.array(param, { maxLength: 3 }),
        (host, path, before, after) => {
          const base = `https://${host}.com/${path.join('/')}`;
          const q = [...before, 'utm_source=chatgpt_plugin', ...after].join('&');
          const out = rewriteUtm(`${base}?${q}`);
          const u = new URL(out);
          const orig = new URL(`${base}?${q}`);
          expect(u.searchParams.get('utm_source')).toBe('haunted_ladder');
          expect(u.host).toBe(orig.host);
          expect(u.pathname).toBe(orig.pathname);
          expect(out).toBe(`${base}?${[...before, 'utm_source=haunted_ladder', ...after].join('&')}`);
        },
      ),
      RUNS,
    );
    expect(rewriteUtm('https://a.com/x')).toBe('https://a.com/x');
    expect(rewriteUtm('https://a.com/?utm_source=other')).toBe('https://a.com/?utm_source=other');
  });
});
