import type { Reading } from './server';

export type Ghost = { fear: string; step: string };

/** One ghost per step with zone 'fear', in server order. The person's words are kept as sent. */
export function ghostsFromReading(r: Reading): Ghost[] {
  return r.steps.filter((s) => s.zone === 'fear').map((s) => ({ fear: s.text, step: '' }));
}

/** A ghost fades when its step has at least one non-space character. */
export function isFaded(g: Ghost): boolean {
  return g.step.trim().length > 0;
}

/** True when every ghost is faded (and for an empty list). */
export function allFaded(gs: Ghost[]): boolean {
  return gs.every(isFaded);
}
