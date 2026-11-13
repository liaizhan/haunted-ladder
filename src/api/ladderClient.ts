import { buildRequest, type LadderDraft } from '../domain/ladder';
import { parseAnswer, type Answer } from '../domain/server';

export const LADDER_URL = 'https://108psy.com/mcp';
export const DEFAULT_TIMEOUT_MS = 20000;

const TIMEOUT: Answer = { kind: 'error', reason: 'timeout' };

/**
 * Sends one `analyze_ladder` call and returns a typed answer. Never throws.
 * Network failure -> reason 'network', timeout -> 'timeout', unreadable body -> 'shape'.
 */
export async function analyze(
  draft: LadderDraft,
  fetchImpl: typeof fetch = (input, init) => fetch(input, init),
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Answer> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<Answer>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(TIMEOUT);
    }, timeoutMs);
  });

  const request = (async (): Promise<Answer> => {
    try {
      const res = await fetchImpl(LADDER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(buildRequest(draft, 1)),
        signal: controller.signal,
      });
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        return controller.signal.aborted
          ? TIMEOUT
          : res.ok
            ? { kind: 'error', reason: 'shape' }
            : { kind: 'error', reason: 'network' };
      }
      return parseAnswer(body);
    } catch {
      return controller.signal.aborted ? TIMEOUT : { kind: 'error', reason: 'network' };
    }
  })();

  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
