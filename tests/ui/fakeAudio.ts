/** A fake AudioContext that records what happens. Not a test file: no `.test` in the name. */
export type FakeLog = { created: number; closed: number; started: number };

export function installFakeAudio(log: FakeLog): void {
  const param = (): unknown => ({
    value: 0,
    setValueAtTime: () => undefined,
    linearRampToValueAtTime: () => undefined,
    cancelScheduledValues: () => undefined,
  });
  const node = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    connect: () => undefined,
    start: () => {
      log.started++;
    },
    stop: () => undefined,
    gain: param(),
    frequency: param(),
    ...extra,
  });
  class FakeAudioContext {
    currentTime = 0;
    sampleRate = 100;
    state = 'running';
    destination = {};
    constructor() {
      log.created++;
    }
    createGain(): unknown {
      return node();
    }
    createOscillator(): unknown {
      return node();
    }
    createBiquadFilter(): unknown {
      return node();
    }
    createBufferSource(): unknown {
      return node();
    }
    createBuffer(_c: number, length: number): unknown {
      return { getChannelData: () => new Float32Array(length) };
    }
    resume(): Promise<void> {
      return Promise.resolve();
    }
    close(): Promise<void> {
      log.closed++;
      return Promise.resolve();
    }
  }
  (globalThis as unknown as Record<string, unknown>)['AudioContext'] = FakeAudioContext;
}

export function removeFakeAudio(): void {
  delete (globalThis as unknown as Record<string, unknown>)['AudioContext'];
}
