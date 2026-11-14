import { en, type Dict } from './locales/en';
import { ru } from './locales/ru';
import { kk } from './locales/kk';

export type Lang = 'en' | 'ru' | 'kk';
export type Key = keyof Dict;

export const LANGS: Lang[] = ['en', 'ru', 'kk'];
/** Short names shown in the language switch. */
export const LANG_NAMES: Record<Lang, string> = { en: 'EN', ru: 'RU', kk: 'KZ' };
export const LANG_KEY = 'haunted-ladder:lang';

export const dictionaries: Record<Lang, Dict> = { en, ru, kk };

let current: Lang = 'en';

export function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'ru' || v === 'kk';
}

/** ru -> ru, kk -> kk, anything else -> en. */
export function langFromNavigator(language: string | undefined): Lang {
  const l = (language ?? '').toLowerCase();
  if (l === 'ru' || l.startsWith('ru-')) return 'ru';
  if (l === 'kk' || l.startsWith('kk-')) return 'kk';
  return 'en';
}

export function getLang(): Lang {
  return current;
}

/** Sets the language, updates `<html lang>` and saves the choice when a store is given. */
export function setLang(lang: Lang, store?: Storage): void {
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  try {
    store?.setItem(LANG_KEY, lang);
  } catch {
    // The choice just is not remembered.
  }
}

/** Picks the saved language, or the browser language the first time. Does not save by itself. */
export function initLang(store?: Storage): Lang {
  let saved: string | null = null;
  try {
    saved = store?.getItem(LANG_KEY) ?? null;
  } catch {
    saved = null;
  }
  const lang = isLang(saved)
    ? saved
    : langFromNavigator(typeof navigator !== 'undefined' ? navigator.language : undefined);
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  return lang;
}

/** The text for `key` in the current language. `{name}` placeholders come from `vars`. */
export function t(key: Key, vars?: Record<string, string | number>): string {
  const text = dictionaries[current][key];
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => {
    const v = vars[name];
    return v === undefined ? m : String(v);
  });
}
