import { describe, it, expect } from 'vitest';
import { analyze, LADDER_URL } from '../../src/api/ladderClient';
import type { LadderDraft } from '../../src/domain/ladder';

const draft: LadderDraft = {
  goal: ' Launch my online course by March ',
  me: 'I have the lessons outlined but nothing recorded',
  blocks: ['Dad: nobody pays for courses', 'Friend: the market is full', 'Teacher: you are not an expert'],
  fears: ['People will laugh at my videos'],
};

const readingPayload = {
  kind: 'reading',
  steps: [
    { number: 1, zone: 'current', zoneLabel: 'I', text: 'I have the lessons outlined' },
    { number: 2, zone: 'goal', zoneLabel: 'Goal', text: 'Launch my online course by March' },
    { number: 3, zone: 'fear', zoneLabel: 'Fear', text: 'People will laugh at my videos' },
  ],
  nearestBlock: 'Dad: nobody pays for courses',
  fearsAboveGoal: ['People will laugh at my videos'],
  insights: ['One insight'],
  questions: ['Q1?', 'Q2?'],
  fullDiagnostic: { text: 'Full diagnostic', url: 'https://108psy.com/?utm_source=chatgpt_plugin' },
  author: 'Aizhan Li, author of the Ladder method',
  disclaimer: 'A tool for self-reflection.',
};

function rpc(payload: unknown): unknown {
  return { jsonrpc: '2.0', id: 1, result: { structuredContent: payload } };
}

function jsonFetch(body: unknown, ok = true): typeof fetch {
  return (async () => ({ ok, json: async () => body }) as unknown as Response) as typeof fetch;
}

describe('ladderClient.analyze', () => {
  it('posts one JSON-RPC tools/call request to the Ladder server', async () => {
    let url = '';
    let init: RequestInit | undefined;
    const f = (async (u: string, i?: RequestInit) => {
      url = u;
      init = i;
      return { ok: true, json: async () => rpc(readingPayload) } as unknown as Response;
    }) as unknown as typeof fetch;
    await analyze(draft, f);
    expect(url).toBe(LADDER_URL);
    expect(init?.method).toBe('POST');
    const body = JSON.parse(String(init?.body)) as {
      jsonrpc: string;
      method: string;
      params: { name: string; arguments: { language: string; goal: string } };
    };
    expect(body.jsonrpc).toBe('2.0');
    expect(body.method).toBe('tools/call');
    expect(body.params.name).toBe('analyze_ladder');
    expect(body.params.arguments.language).toBe('en');
    expect(body.params.arguments.goal).toBe('Launch my online course by March');
  });

  it('returns a reading', async () => {
    const a = await analyze(draft, jsonFetch(rpc(readingPayload)));
    expect(a.kind).toBe('reading');
  });

  it('returns a crisis answer', async () => {
    const a = await analyze(
      draft,
      jsonFetch(rpc({ kind: 'crisis', message: 'Please reach out.', helpUrl: 'https://example.org/help' })),
    );
    expect(a).toEqual({ kind: 'crisis', message: 'Please reach out.', helpUrl: 'https://example.org/help' });
  });

  it('returns a health answer', async () => {
    const a = await analyze(draft, jsonFetch(rpc({ kind: 'health', message: 'Please edit.', helpUrl: null })));
    expect(a).toEqual({ kind: 'health', message: 'Please edit.' });
  });

  it('returns an rpc error', async () => {
    const a = await analyze(
      draft,
      jsonFetch({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'boom' } }),
    );
    expect(a).toEqual({ kind: 'error', reason: 'rpc' });
  });

  it('returns a shape error for broken JSON', async () => {
    const f = (async () =>
      ({
        ok: true,
        json: async () => {
          throw new SyntaxError('bad json');
        },
      }) as unknown as Response) as typeof fetch;
    expect(await analyze(draft, f)).toEqual({ kind: 'error', reason: 'shape' });
  });

  it('returns a network error when fetch rejects', async () => {
    const f = (async () => {
      throw new TypeError('Failed to fetch');
    }) as typeof fetch;
    expect(await analyze(draft, f)).toEqual({ kind: 'error', reason: 'network' });
  });

  it('returns a network error for a failed HTTP status with no JSON', async () => {
    const f = (async () =>
      ({
        ok: false,
        json: async () => {
          throw new SyntaxError('no json');
        },
      }) as unknown as Response) as typeof fetch;
    expect(await analyze(draft, f)).toEqual({ kind: 'error', reason: 'network' });
  });

  it('times out and aborts the request', async () => {
    let aborted = false;
    const f = ((_u: string, i?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        i?.signal?.addEventListener('abort', () => {
          aborted = true;
          reject(new DOMException('aborted', 'AbortError'));
        });
      })) as unknown as typeof fetch;
    const a = await analyze(draft, f, 20);
    expect(a).toEqual({ kind: 'error', reason: 'timeout' });
    expect(aborted).toBe(true);
  });

  it('times out even when fetch ignores the abort signal', async () => {
    const f = (() => new Promise<Response>(() => undefined)) as unknown as typeof fetch;
    expect(await analyze(draft, f, 20)).toEqual({ kind: 'error', reason: 'timeout' });
  });
});
