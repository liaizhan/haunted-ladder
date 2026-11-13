import { loadSettings, saveSettings } from '../domain/settings';

const FADE_SECONDS = 2;
const PEAK_GAIN = 0.18;
const LOOKAHEAD_SECONDS = 1;
const TICK_MS = 250;

export type NightSound = {
  /** Starts wind and heartbeat with a 2 second fade in. Needs a user gesture. */
  start: () => void;
  /** Fades out over 2 seconds, then releases the audio. */
  stop: () => void;
  /** Stops at once and releases the audio. Used by the calm screens. */
  kill: () => void;
  readonly active: boolean;
};

export type NightSoundOptions = {
  /** Seconds per beat, read live so the heartbeat follows `--beat`. */
  getBeatSeconds: () => number;
  /** Creates the AudioContext. Called only from start(). Return null when unsupported. */
  createContext?: () => AudioContext | null;
};

function defaultContext(): AudioContext | null {
  const g = globalThis as unknown as {
    AudioContext?: new () => AudioContext;
    webkitAudioContext?: new () => AudioContext;
  };
  const Ctor = g.AudioContext ?? g.webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

/** Reads `--beat` (e.g. "1s") from an element, falling back to 1 second. */
export function readBeatSeconds(el: HTMLElement | null): number {
  if (!el) return 1;
  const n = parseFloat(el.style.getPropertyValue('--beat'));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Web Audio only, no files: filtered brown-noise wind and a quiet "lub-dub" heartbeat. */
export function createNightSound(opts: NightSoundOptions): NightSound {
  const make = opts.createContext ?? defaultContext;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let heart: GainNode | null = null;
  let sources: AudioScheduledSourceNode[] = [];
  let tickTimer: ReturnType<typeof setTimeout> | undefined;
  let stopTimer: ReturnType<typeof setTimeout> | undefined;
  let nextBeat = 0;
  let on = false;

  const beatSeconds = (): number => {
    const b = opts.getBeatSeconds();
    return Number.isFinite(b) ? Math.min(2, Math.max(0.4, b)) : 1;
  };

  const thump = (c: AudioContext, out: GainNode, when: number, freq: number, peak: number, dur: number): void => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.03);
    g.gain.linearRampToValueAtTime(0, when + dur);
    osc.connect(g);
    g.connect(out);
    osc.start(when);
    osc.stop(when + dur + 0.05);
    sources.push(osc);
  };

  const schedule = (): void => {
    if (!ctx || !heart || !on) return;
    const c = ctx;
    if (nextBeat < c.currentTime) nextBeat = c.currentTime + 0.05;
    while (nextBeat < c.currentTime + LOOKAHEAD_SECONDS) {
      const beat = beatSeconds();
      thump(c, heart, nextBeat, 55, 0.9, 0.18);
      thump(c, heart, nextBeat + Math.min(0.3, beat * 0.35), 46, 0.55, 0.14);
      nextBeat += beat;
    }
    tickTimer = setTimeout(schedule, TICK_MS);
  };

  const teardown = (): void => {
    if (tickTimer !== undefined) clearTimeout(tickTimer);
    if (stopTimer !== undefined) clearTimeout(stopTimer);
    tickTimer = undefined;
    stopTimer = undefined;
    for (const s of sources) {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    }
    sources = [];
    const c = ctx;
    ctx = null;
    master = null;
    heart = null;
    if (c) {
      try {
        void Promise.resolve(c.close()).catch(() => undefined);
      } catch {
        // ignore
      }
    }
  };

  const build = (c: AudioContext): void => {
    master = c.createGain();
    master.gain.value = 0;
    master.connect(c.destination);

    // Wind: looping brown noise through a low-pass filter, with a slow gain wobble.
    const length = Math.max(1, Math.floor(c.sampleRate * 2));
    const buffer = c.createBuffer(1, length, c.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const wind = c.createGain();
    wind.gain.value = 0.7;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.12;
    const depth = c.createGain();
    depth.gain.value = 0.25;
    lfo.connect(depth);
    depth.connect(wind.gain);
    noise.connect(filter);
    filter.connect(wind);
    wind.connect(master);
    noise.start();
    lfo.start();
    sources.push(noise, lfo);

    heart = c.createGain();
    heart.gain.value = 0.6;
    heart.connect(master);
  };

  const fadeTo = (value: number): void => {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(value, now + FADE_SECONDS);
  };

  return {
    get active(): boolean {
      return on;
    },
    start(): void {
      if (on) return;
      if (stopTimer !== undefined) {
        clearTimeout(stopTimer);
        stopTimer = undefined;
      }
      if (!ctx) {
        const c = make();
        if (!c) return;
        ctx = c;
        build(c);
        nextBeat = 0;
      }
      on = true;
      try {
        if (ctx.state === 'suspended') void Promise.resolve(ctx.resume()).catch(() => undefined);
      } catch {
        // ignore
      }
      fadeTo(PEAK_GAIN);
      if (tickTimer !== undefined) clearTimeout(tickTimer);
      schedule();
    },
    stop(): void {
      if (!on || !ctx) return;
      on = false;
      if (tickTimer !== undefined) clearTimeout(tickTimer);
      tickTimer = undefined;
      fadeTo(0);
      stopTimer = setTimeout(teardown, FADE_SECONDS * 1000 + 100);
    },
    kill(): void {
      on = false;
      if (ctx && master) {
        try {
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setValueAtTime(0, ctx.currentTime);
        } catch {
          // ignore
        }
      }
      teardown();
    },
  };
}

export type SoundToggle = { element: HTMLButtonElement };

/**
 * The "Night sound" button. It always starts off (aria-pressed="false") and creates no audio
 * until it is pressed, even if the person left the sound on last time.
 */
export function buildSoundToggle(sound: NightSound, store?: Storage): SoundToggle {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'night-sound secondary';
  element.textContent = 'Night sound';
  element.setAttribute('aria-pressed', 'false');

  const target = store ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
  if (target && loadSettings(target).sound) {
    element.title = 'Sound was on last time. Press to play.';
  }

  element.addEventListener('click', () => {
    const turnOn = element.getAttribute('aria-pressed') !== 'true';
    if (turnOn) sound.start();
    else sound.stop();
    element.setAttribute('aria-pressed', String(turnOn));
    if (target) saveSettings({ sound: turnOn }, target);
  });
  return { element };
}
