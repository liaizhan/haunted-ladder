// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { showCalm, SPOOKY_SELECTOR } from '../../src/ui/calm';
import { load, save, STORAGE_KEY } from '../../src/domain/storage';
import { buildFog } from '../../src/ui/fog';
import { buildHeart } from '../../src/ui/heart';
import { buildSoundToggle, createNightSound } from '../../src/ui/nightSound';
import { installFakeAudio, removeFakeAudio, type FakeLog } from './fakeAudio';

const RUNS = { numRuns: 100 };

function spookyPage(): HTMLElement {
  document.body.className = '';
  document.body.replaceChildren();
  const app = document.createElement('div');
  app.id = 'app';
  document.body.append(app);
  for (const c of ['stair', 'ghost', 'cobweb', 'moon', 'fog', 'heart']) {
    const n = document.createElement('div');
    n.className = c;
    // some outside #app, some inside
    (c === 'fog' || c === 'heart' ? document.body : app).append(n);
  }
  return app;
}

beforeEach(() => {
  localStorage.clear();
});

describe('Property 5: Crisis wins', () => {
  it('removes every spooky element, kills sound and clears the draft', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.webUrl(), (message, helpUrl) => {
        const app = spookyPage();
        save({ draft: { goal: 'g', me: 'm', blocks: ['a', 'b', 'c'], fears: ['f'] }, steps: {} }, localStorage);
        const kill = vi.fn();
        showCalm(app, { kind: 'crisis', message, helpUrl }, { onBack: () => {}, kill });

        expect(document.querySelectorAll(SPOOKY_SELECTOR).length).toBe(0);
        expect(kill).toHaveBeenCalled();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(load(localStorage)).toBeNull();
        expect(document.body.classList.contains('calm')).toBe(true);
        expect(app.querySelector('.calm-message')?.textContent).toBe(message);
        expect(app.querySelector('a')?.getAttribute('href')).toBeTruthy();
        // only one button, no steps, insights, questions, save or diagnostic link
        expect(app.querySelectorAll('button').length).toBe(1);
        expect(app.querySelector('button')?.textContent).toBe('Back to the start');
        expect(app.querySelectorAll('a').length).toBe(1);
        expect(app.querySelector('input, .insights, .questions, .save, .diagnostic')).toBeNull();
      }),
      RUNS,
    );
  });

  it('renders message as text, never as HTML', () => {
    const app = spookyPage();
    showCalm(app, { kind: 'crisis', message: '<b>x</b> & y', helpUrl: 'https://example.org/help' }, { onBack: () => {} });
    expect(app.querySelector('.calm-message')?.textContent).toBe('<b>x</b> & y');
    expect(app.querySelector('b')).toBeNull();
  });
});

describe('Property 5 (extended): fog, heart and sound', () => {
  it('real fog, heart and a playing night sound are gone after a crisis', () => {
    const log: FakeLog = { created: 0, closed: 0, started: 0 };
    installFakeAudio(log);
    try {
      const app = spookyPage();
      const fog = buildFog();
      const ghosts = [{ fear: 'f', step: '' }];
      const heart = buildHeart(ghosts);
      const sound = createNightSound({ getBeatSeconds: () => 1 });
      const toggle = buildSoundToggle(sound, localStorage);
      document.body.append(fog.element, heart.element, toggle.element);
      toggle.element.click();
      expect(sound.active).toBe(true);

      showCalm(app, { kind: 'crisis', message: 'm', helpUrl: 'https://example.org/h' }, { onBack: () => {}, kill: sound.kill });

      expect(document.querySelectorAll(SPOOKY_SELECTOR).length).toBe(0);
      expect(document.querySelector('.night-sound')).toBeNull();
      expect(sound.active).toBe(false);
      expect(log.closed).toBe(1);
      heart.destroy();
      fog.destroy();
    } finally {
      removeFakeAudio();
    }
  });
});

describe('Health and error screens', () => {
  it('health keeps the draft, shows message and Edit answers', () => {
    const app = spookyPage();
    save({ draft: { goal: 'g', me: 'm', blocks: ['a', 'b', 'c'], fears: [] }, steps: {} }, localStorage);
    const kill = vi.fn();
    const onBack = vi.fn();
    showCalm(app, { kind: 'health', message: 'Please talk to a doctor.' }, { onBack, kill });
    expect(kill).toHaveBeenCalled();
    expect(document.querySelectorAll(SPOOKY_SELECTOR).length).toBe(0);
    expect(load(localStorage)).not.toBeNull();
    const btn = app.querySelector('button');
    expect(btn?.textContent).toBe('Edit answers');
    btn?.click();
    expect(onBack).toHaveBeenCalled();
    expect(document.body.classList.contains('calm')).toBe(false);
  });

  it('error offers Try again and Edit answers', () => {
    const app = spookyPage();
    const onRetry = vi.fn();
    const onBack = vi.fn();
    showCalm(app, { kind: 'error', reason: 'network' }, { onBack, onRetry, kill: () => {} });
    const labels = Array.from(app.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels).toEqual(['Try again', 'Edit answers']);
    app.querySelectorAll('button')[0]?.click();
    expect(onRetry).toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });
});
