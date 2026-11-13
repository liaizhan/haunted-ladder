// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { loadSettings, saveSettings, SETTINGS_KEY } from '../../src/domain/settings';
import { buildSoundToggle, createNightSound } from '../../src/ui/nightSound';
import { installFakeAudio, removeFakeAudio, type FakeLog } from './fakeAudio';

const RUNS = { numRuns: 100 };
let log: FakeLog;

beforeEach(() => {
  localStorage.clear();
  log = { created: 0, closed: 0, started: 0 };
  installFakeAudio(log);
});
afterEach(() => removeFakeAudio());

describe('Property 12: Silence by default', () => {
  it('loadSettings never throws and creates no audio, whatever is stored', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.json(), fc.constant('{"sound":true}')), (raw) => {
        log.created = 0;
        localStorage.setItem(SETTINGS_KEY, raw);
        const s = loadSettings(localStorage);
        expect(typeof s.sound).toBe('boolean');

        const sound = createNightSound({ getBeatSeconds: () => 1 });
        const { element } = buildSoundToggle(sound, localStorage);
        document.body.append(element);
        expect(log.created).toBe(0);
        expect(element.getAttribute('aria-pressed')).toBe('false');

        element.click();
        expect(log.created).toBe(1);
        expect(element.getAttribute('aria-pressed')).toBe('true');
        expect(loadSettings(localStorage).sound).toBe(true);

        element.click();
        expect(element.getAttribute('aria-pressed')).toBe('false');
        expect(loadSettings(localStorage).sound).toBe(false);
        sound.kill();
        element.remove();
      }),
      RUNS,
    );
  });

  it('loadSettings returns sound:false when storage is missing, broken or throws', () => {
    expect(loadSettings(localStorage)).toEqual({ sound: false });
    localStorage.setItem(SETTINGS_KEY, '{not json');
    expect(loadSettings(localStorage)).toEqual({ sound: false });
    const throwing = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    } as unknown as Storage;
    expect(loadSettings(throwing)).toEqual({ sound: false });
    expect(() => saveSettings({ sound: true }, throwing)).not.toThrow();
  });

  it('settings round trip', () => {
    fc.assert(
      fc.property(fc.boolean(), (sound) => {
        saveSettings({ sound }, localStorage);
        expect(loadSettings(localStorage)).toEqual({ sound });
      }),
      RUNS,
    );
  });

  it('kill() releases the audio at once', () => {
    const sound = createNightSound({ getBeatSeconds: () => 1 });
    sound.start();
    expect(sound.active).toBe(true);
    sound.kill();
    expect(sound.active).toBe(false);
    expect(log.closed).toBe(1);
  });
});
