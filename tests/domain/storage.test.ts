import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { save, load, clear, STORAGE_KEY, type Saved } from '../../src/domain/storage';

const RUNS = { numRuns: 100 };

const savedArb: fc.Arbitrary<Saved> = fc.record({
  draft: fc.record({
    goal: fc.string(),
    me: fc.string(),
    blocks: fc.array(fc.string(), { maxLength: 5 }),
    fears: fc.array(fc.string(), { maxLength: 5 }),
  }),
  steps: fc
    .array(fc.tuple(fc.string().filter((k) => k !== '__proto__'), fc.string()), { maxLength: 5 })
    .map((pairs) => Object.fromEntries(pairs) as Record<string, string>),
});

describe('storage domain', () => {
  beforeEach(() => localStorage.clear());

  // Feature: haunted-ladder, Property 9: Storage round trip
  it('Property 9: load(save(s)) equals s', () => {
    fc.assert(
      fc.property(savedArb, (s) => {
        save(s, localStorage);
        expect(load(localStorage)).toEqual(s);
        clear(localStorage);
        expect(load(localStorage)).toBeNull();
      }),
      RUNS,
    );
  });

  // Feature: haunted-ladder, Property 9: Storage round trip
  it('Property 9: broken JSON gives null and never throws', () => {
    fc.assert(
      fc.property(fc.string(), (junk) => {
        localStorage.setItem(STORAGE_KEY, junk);
        expect(() => load(localStorage)).not.toThrow();
        const r = load(localStorage);
        if (r !== null) {
          expect(typeof r.draft.goal).toBe('string');
        }
      }),
      RUNS,
    );
    for (const bad of ['null', '[]', '{}', '{"draft":1,"steps":{}}', '{"draft":{"goal":"a","me":"b","blocks":[1],"fears":[]},"steps":{}}']) {
      localStorage.setItem(STORAGE_KEY, bad);
      expect(load(localStorage)).toBeNull();
    }
  });

  it('survives a storage that throws', () => {
    const boom = {
      getItem: () => {
        throw new Error('x');
      },
      setItem: () => {
        throw new Error('x');
      },
      removeItem: () => {
        throw new Error('x');
      },
    } as unknown as Storage;
    const s: Saved = { draft: { goal: 'g', me: 'm', blocks: [], fears: [] }, steps: {} };
    expect(() => save(s, boom)).not.toThrow();
    expect(load(boom)).toBeNull();
    expect(() => clear(boom)).not.toThrow();
  });
});
