export type Zone = 'current' | 'block' | 'goal' | 'fear';

export type Step = {
  number: number;
  zone: Zone;
  zoneLabel: string;
  text: string;
};

export type Reading = {
  kind: 'reading';
  steps: Step[];
  nearestBlock: string | null;
  fearsAboveGoal: string[];
  insights: string[];
  questions: string[];
  fullDiagnostic: { text: string; url: string };
  author: string;
  disclaimer: string;
};

export type Crisis = { kind: 'crisis'; message: string; helpUrl: string };
export type Health = { kind: 'health'; message: string };
export type Failure = {
  kind: 'error';
  reason: 'network' | 'rpc' | 'shape' | 'timeout';
};
export type Answer = Reading | Crisis | Health | Failure;

const SHAPE: Failure = { kind: 'error', reason: 'shape' };
const ZONES: readonly string[] = ['current', 'block', 'goal', 'fear'];

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isStr(v: unknown): v is string {
  return typeof v === 'string';
}

function strArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const out: string[] = [];
  for (const item of v as unknown[]) {
    if (!isStr(item)) return null;
    out.push(item);
  }
  return out;
}

function parseStep(v: unknown): Step | null {
  if (!isObj(v)) return null;
  const { number, zone, zoneLabel, text } = v;
  if (typeof number !== 'number' || !Number.isFinite(number)) return null;
  if (!isStr(zone) || !ZONES.includes(zone)) return null;
  if (!isStr(zoneLabel) || !isStr(text)) return null;
  return { number, zone: zone as Zone, zoneLabel, text };
}

function parseReading(o: Obj): Reading | null {
  if (!Array.isArray(o['steps'])) return null;
  const steps: Step[] = [];
  for (const raw of o['steps'] as unknown[]) {
    const s = parseStep(raw);
    if (!s) return null;
    steps.push(s);
  }

  const nb = o['nearestBlock'];
  if (nb !== undefined && nb !== null && !isStr(nb)) return null;

  const fearsAboveGoal = o['fearsAboveGoal'] === undefined ? [] : strArray(o['fearsAboveGoal']);
  const insights = strArray(o['insights']);
  const questions = strArray(o['questions']);
  if (!fearsAboveGoal || !insights || !questions) return null;

  const fd = o['fullDiagnostic'];
  if (!isObj(fd) || !isStr(fd['text']) || !isStr(fd['url'])) return null;

  if (!isStr(o['author']) || !isStr(o['disclaimer'])) return null;

  return {
    kind: 'reading',
    steps,
    nearestBlock: nb ?? null,
    fearsAboveGoal,
    insights,
    questions,
    fullDiagnostic: { text: fd['text'], url: fd['url'] },
    author: o['author'],
    disclaimer: o['disclaimer'],
  };
}

function parseContent(o: Obj): Answer {
  switch (o['kind']) {
    case 'reading':
      return parseReading(o) ?? SHAPE;
    case 'crisis':
      return isStr(o['message']) && isStr(o['helpUrl'])
        ? { kind: 'crisis', message: o['message'], helpUrl: o['helpUrl'] }
        : SHAPE;
    case 'health':
      return isStr(o['message']) ? { kind: 'health', message: o['message'] } : SHAPE;
    default:
      return SHAPE;
  }
}

/**
 * Turns a JSON-RPC response body into a typed answer. Never throws.
 * Reads `result.structuredContent`, falls back to `result.content[0].text`.
 */
export function parseAnswer(raw: unknown): Answer {
  try {
    if (!isObj(raw)) return SHAPE;
    if (raw['error'] !== undefined && raw['error'] !== null) {
      return { kind: 'error', reason: 'rpc' };
    }
    const result = raw['result'];
    if (!isObj(result)) return SHAPE;

    let payload: unknown = result['structuredContent'];
    if (!isObj(payload)) {
      const content = result['content'];
      if (!Array.isArray(content)) return SHAPE;
      const first: unknown = (content as unknown[])[0];
      if (!isObj(first) || !isStr(first['text'])) return SHAPE;
      payload = JSON.parse(first['text']);
    }
    return isObj(payload) ? parseContent(payload) : SHAPE;
  } catch {
    return SHAPE;
  }
}

/** Replaces `utm_source=chatgpt_plugin` with `utm_source=haunted_ladder`, touching nothing else. */
export function rewriteUtm(url: string): string {
  return url.replace(
    /([?&])utm_source=chatgpt_plugin(?=[&#]|$)/g,
    '$1utm_source=haunted_ladder',
  );
}
