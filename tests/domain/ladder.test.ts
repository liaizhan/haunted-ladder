import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validatePhrase,
  validateDraft,
  buildRequest,
  type LadderDraft,
} from '../../src/domain/ladder';

const RUNS = { numRuns: 100 };

// A phrase with 1..300 characters after trimming, optionally padded with spaces.
const goodPhrase = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 300 }).filter((s) => s.trim().length >= 1 && s.trim().length <= 300),
    fc.constantFrom('', ' ', '  ', '\t'),
    fc.constantFrom('', ' ', '\n'),
  )
  .map(([s, a, b]) => a + s + b);

const validDraft: fc.Arbitrary<LadderDraft> = fc.record({
  goal: goodPhrase,
  me: goodPhrase,
  blocks: fc.array(goodPhrase, { minLength: 3, maxLength: 5 }),
  fears: fc.array(fc.oneof(goodPhrase, fc.constantFrom('', '   ')), { minLength: 0, maxLength: 5 }),
});

describe('ladder domain', () => {
  // Feature: haunted-ladder, Property 1: Phrase validation
  it('Property 1: validatePhrase is null exactly when trimmed length is 1..300', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 400 }), (s) => {
        const len = s.trim().length;
        expect(validatePhrase(s) === null).toBe(len >= 1 && len <= 300);
      }),
      RUNS,
    );
    expect(validatePhrase('   ')).toBe('empty');
    expect(validatePhrase('a'.repeat(301))).toBe('tooLong');
    expect(validatePhrase('a'.repeat(300))).toBeNull();
  });

  // Feature: haunted-ladder, Property 2: Request respects the server limits
  it('Property 2: request respects the server limits', () => {
    fc.assert(
      fc.property(validDraft, fc.integer({ min: 1, max: 1000 }), (d, id) => {
        expect(validateDraft(d).ok).toBe(true);
        const req = buildRequest(d, id);
        const a = req.params.arguments;
        expect(req.jsonrpc).toBe('2.0');
        expect(req.method).toBe('tools/call');
        expect(req.params.name).toBe('analyze_ladder');
        expect(req.id).toBe(id);
        expect(a.language).toBe('en');
        expect(a.blocks.length).toBeGreaterThanOrEqual(3);
        expect(a.blocks.length).toBeLessThanOrEqual(5);
        expect(a.fears.length).toBeLessThanOrEqual(5);
        for (const p of [a.goal, a.me, ...a.blocks, ...a.fears]) {
          expect(p).toBe(p.trim());
          expect(p.length).toBeGreaterThanOrEqual(1);
          expect(p.length).toBeLessThanOrEqual(300);
        }
      }),
      RUNS,
    );
  });

  // Feature: haunted-ladder, Property 2: Request respects the server limits
  it('Property 2: drafts with too few or too many items are rejected', () => {
    fc.assert(
      fc.property(validDraft, fc.integer({ min: 0, max: 2 }), (d, n) => {
        expect(validateDraft({ ...d, blocks: d.blocks.slice(0, n) }).ok).toBe(false);
        const six = [...d.blocks, ...d.blocks].slice(0, 6);
        if (six.length === 6) expect(validateDraft({ ...d, blocks: six }).ok).toBe(false);
      }),
      RUNS,
    );
    const base: LadderDraft = { goal: 'g', me: 'm', blocks: ['a', 'b', 'c'], fears: [] };
    expect(validateDraft(base).ok).toBe(true);
    expect(validateDraft({ ...base, fears: ['1', '2', '3', '4', '5', '6'] }).ok).toBe(false);
    expect(validateDraft({ ...base, goal: ' ' }).errors['goal']).toBe('empty');
  });

  // Feature: haunted-ladder, Property 3: Words are kept exactly
  it('Property 3: trimmed phrases are kept exactly and in order', () => {
    fc.assert(
      fc.property(validDraft, (d) => {
        const a = buildRequest(d, 1).params.arguments;
        expect(a.goal).toBe(d.goal.trim());
        expect(a.me).toBe(d.me.trim());
        expect(a.blocks).toEqual(d.blocks.map((b) => b.trim()));
        expect(a.fears).toEqual(d.fears.map((f) => f.trim()).filter((f) => f !== ''));
      }),
      RUNS,
    );
  });
});
