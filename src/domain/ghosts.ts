import type { Reading } from './server';

export type Ghost = { fear: string; step: string };

/** One ghost per step with zone 'fear', in server order. The person's words are kept as sent. */
export function ghostsFromReading(r: Reading): Ghost[] {
  return r.steps.filter((s) => s.zone === 'fear').map((s) => ({ fear: s.text, step: '' }));
}

/** Puts saved steps back on ghosts, matched by the fear's exact text. Returns new ghosts. */
export function applySavedSteps(gs: Ghost[], steps: Record<string, string>): Ghost[] {
  return gs.map((g) => {
    const saved = Object.prototype.hasOwnProperty.call(steps, g.fear) ? steps[g.fear] : undefined;
    return { fear: g.fear, step: saved ?? g.step };
  });
}

/** The steps as stored: fear text -> step text. Empty steps are left out. */
export function stepsRecord(gs: Ghost[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of gs) if (g.step.trim().length > 0) out[g.fear] = g.step;
  return out;
}

/** A ghost fades when its step has at least one non-space character. */
export function isFaded(g: Ghost): boolean {
  return g.step.trim().length > 0;
}

/** True when every ghost is faded (and for an empty list). */
export function allFaded(gs: Ghost[]): boolean {
  return gs.every(isFaded);
}
