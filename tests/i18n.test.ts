// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  LANGS,
  LANG_KEY,
  dictionaries,
  getLang,
  initLang,
  langFromNavigator,
  setLang,
  t,
  type Key,
  type Lang,
} from '../src/i18n';
import { buildRequest, validateDraft } from '../src/domain/ladder';
import { demoDraft } from '../src/domain/demo';
import { analyze } from '../src/api/ladderClient';
import { mountApp } from '../src/main';

function memoryStore(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

const FORBIDDEN = ['psycholog', 'therapist', 'психолог', 'психотерапевт'];
const keysOf = (lang: Lang): string[] => Object.keys(dictionaries[lang]).sort();
const placeholders = (s: string): string[] => (s.match(/\{\w+\}/g) ?? []).sort();

describe('Property 18: Same words in every language', () => {
  afterEach(() => setLang('en'));

  // Feature: haunted-ladder, Property 18: Same words in every language
  it('every dictionary has the same keys, no empty value and no forbidden word', () => {
    expect(keysOf('ru')).toEqual(keysOf('en'));
    expect(keysOf('kk')).toEqual(keysOf('en'));
    const keys = keysOf('en') as Key[];
    fc.assert(
      fc.property(fc.constantFrom(...LANGS), fc.constantFrom(...keys), (lang, key) => {
        const value = dictionaries[lang][key];
        expect(value.trim().length).toBeGreaterThan(0);
        for (const word of FORBIDDEN) expect(value.toLowerCase()).not.toContain(word);
        // The same {placeholders} in every language, so no text loses a value.
        expect(placeholders(value)).toEqual(placeholders(dictionaries.en[key]));
      }),
      { numRuns: 300 },
    );
  });

  it('names the author the way the spec says', () => {
    expect(dictionaries.ru.introP1).toContain('автор методики «Лестница»');
    expect(dictionaries.kk.introP1).toContain('«Баспалдақ» әдістемесінің авторы');
  });

  it('t() fills placeholders in the current language', () => {
    setLang('ru');
    expect(t('progress', { n: 2, total: 4 })).toBe('Вопрос 2 из 4');
    setLang('en');
    expect(t('progress', { n: 2, total: 4 })).toBe('Question 2 of 4');
  });
});

describe('language choice', () => {
  afterEach(() => setLang('en'));

  it('langFromNavigator maps ru and kk, anything else is en', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 12 }), (s) => {
        const l = s.toLowerCase();
        const expected = l === 'ru' || l.startsWith('ru-') ? 'ru' : l === 'kk' || l.startsWith('kk-') ? 'kk' : 'en';
        expect(langFromNavigator(s)).toBe(expected);
      }),
    );
    expect(langFromNavigator('ru-RU')).toBe('ru');
    expect(langFromNavigator('kk-KZ')).toBe('kk');
    expect(langFromNavigator('de-DE')).toBe('en');
    expect(langFromNavigator(undefined)).toBe('en');
  });

  it('setLang saves the choice and sets <html lang>; initLang reads it back', () => {
    fc.assert(
      fc.property(fc.constantFrom(...LANGS), (lang) => {
        const store = memoryStore();
        setLang(lang, store);
        expect(document.documentElement.lang).toBe(lang);
        expect(store.getItem(LANG_KEY)).toBe(lang);
        setLang('en');
        expect(initLang(store)).toBe(lang);
        expect(getLang()).toBe(lang);
      }),
    );
  });

  it('a broken saved value falls back to the browser language', () => {
    const store = memoryStore();
    store.setItem(LANG_KEY, 'fr');
    expect(initLang(store)).toBe('en');
  });

  it('the request carries the chosen language and the demo phrases are in it', async () => {
    for (const lang of LANGS) {
      const d = demoDraft(lang);
      expect(validateDraft(d).ok).toBe(true);
      expect(d.fears.length).toBe(3);
      expect(buildRequest(d, 1, lang).params.arguments.language).toBe(lang);
    }
    expect(demoDraft('ru').goal).not.toBe(demoDraft('en').goal);
    expect(buildRequest(demoDraft(), 1).params.arguments.language).toBe('en');

    let body = '';
    const f = (async (_url: unknown, init?: RequestInit) => {
      body = String(init?.body);
      return { ok: true, json: async () => ({}) } as unknown as Response;
    }) as unknown as typeof fetch;
    await analyze(demoDraft('kk'), f, 1000, 'kk');
    expect(JSON.parse(body).params.arguments.language).toBe('kk');
  });

  it('the switch changes the screen text, the saved choice and <html lang>', () => {
    document.body.replaceChildren();
    const root = document.createElement('main');
    document.body.append(root);
    const store = memoryStore();
    mountApp(root, { store, analyze: async () => ({ kind: 'error', reason: 'network' }) });
    const select = root.querySelector('select');
    expect(select).not.toBeNull();
    expect(root.querySelector('.intro button')?.textContent).toBe('Start');
    if (!select) return;
    select.value = 'ru';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(root.querySelector('.intro button')?.textContent).toBe('Начать');
    expect(document.documentElement.lang).toBe('ru');
    expect(store.getItem(LANG_KEY)).toBe('ru');
    expect(root.querySelectorAll('.lang-switch').length).toBe(1);
    // The question screen shows the server's own Russian question.
    (root.querySelector('.intro button') as HTMLButtonElement).click();
    expect(root.querySelector('h2')?.textContent).toBe(dictionaries.ru.qGoalTitle);
  });
});
