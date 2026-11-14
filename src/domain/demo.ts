import type { LadderDraft } from './ladder';

/** True exactly when the query string has the parameter `demo` equal to `1`. */
export function isDemo(search: string): boolean {
  const query = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(query).getAll('demo').includes('1');
}

const SAMPLES: Record<'en' | 'ru' | 'kk', LadderDraft> = {
  en: {
    goal: 'Launch my online course by March',
    me: 'I have the lessons outlined but nothing recorded',
    blocks: [
      'Dad: nobody pays for courses',
      'Friend: the market is full',
      'Teacher: you are not an expert',
    ],
    fears: [
      'People will laugh at my videos',
      'I will spend the money and sell nothing',
      'My family will see me fail',
    ],
  },
  ru: {
    goal: 'Запустить мой онлайн-курс к марту',
    me: 'Уроки расписаны, но ничего не записано',
    blocks: [
      'Папа: за курсы никто не платит',
      'Подруга: рынок уже переполнен',
      'Учитель: ты не эксперт',
    ],
    fears: [
      'Люди будут смеяться над моими видео',
      'Я потрачу деньги и ничего не продам',
      'Моя семья увидит, как я проваливаюсь',
    ],
  },
  kk: {
    goal: 'Наурызға дейін онлайн-курсымды іске қосу',
    me: 'Сабақтардың жоспары бар, бірақ ештеңе жазылмаған',
    blocks: [
      'Әкем: курсқа ешкім ақша төлемейді',
      'Құрбым: нарық толып кеткен',
      'Мұғалім: сен маман емессің',
    ],
    fears: [
      'Адамдар менің бейнелеріме күледі',
      'Ақшамды жұмсап, ештеңе сата алмаймын',
      'Отбасым менің сәтсіздікке ұшырағанымды көреді',
    ],
  },
};

/** The sample ladder for the `?demo=1` link, in the chosen language. Always passes `validateDraft`. */
export function demoDraft(language: 'en' | 'ru' | 'kk' = 'en'): LadderDraft {
  const s = SAMPLES[language];
  return { goal: s.goal, me: s.me, blocks: [...s.blocks], fears: [...s.fears] };
}
