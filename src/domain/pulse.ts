/** Heart rate from the number of ghosts without a step: 60 when none, +12 each, never above 120. */
export function beatsPerMinute(unfaded: number): number {
  return Math.min(60 + 12 * Math.max(unfaded, 0), 120);
}

/** Seconds for one heartbeat at the given rate. */
export function secondsPerBeat(bpm: number): number {
  return 60 / bpm;
}
