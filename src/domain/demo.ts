import type { LadderDraft } from './ladder';

/** True exactly when the query string has the parameter `demo` equal to `1`. */
export function isDemo(search: string): boolean {
  const query = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(query).getAll('demo').includes('1');
}

/** The sample ladder for the `?demo=1` link. Always passes `validateDraft`. */
export function demoDraft(): LadderDraft {
  return {
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
  };
}
