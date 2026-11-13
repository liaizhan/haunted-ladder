export type LadderDraft = {
  goal: string;
  me: string;
  blocks: string[];
  fears: string[];
};

export type FieldError = 'empty' | 'tooLong';

export type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: number;
  method: 'tools/call';
  params: {
    name: 'analyze_ladder';
    arguments: {
      language: 'en';
      goal: string;
      me: string;
      blocks: string[];
      fears: string[];
    };
  };
};

export const MAX_PHRASE = 300;
export const MIN_BLOCKS = 3;
export const MAX_BLOCKS = 5;
export const MAX_FEARS = 5;

/** A phrase is valid when it has 1 to 300 characters after trimming. */
export function validatePhrase(text: string): FieldError | null {
  const len = text.trim().length;
  if (len < 1) return 'empty';
  if (len > MAX_PHRASE) return 'tooLong';
  return null;
}

/**
 * Error keys: `goal`, `me`, `blocks.<i>`, `fears.<i>`, plus `blocks` and
 * `fears` for the item count ('empty' = too few, 'tooLong' = too many).
 * Empty fear rows are allowed: they are dropped when the request is built.
 */
export function validateDraft(d: LadderDraft): {
  ok: boolean;
  errors: Record<string, FieldError>;
} {
  const errors: Record<string, FieldError> = {};

  const goal = validatePhrase(d.goal);
  if (goal) errors['goal'] = goal;
  const me = validatePhrase(d.me);
  if (me) errors['me'] = me;

  d.blocks.forEach((b, i) => {
    const e = validatePhrase(b);
    if (e) errors[`blocks.${i}`] = e;
  });
  if (d.blocks.length < MIN_BLOCKS) errors['blocks'] = 'empty';
  else if (d.blocks.length > MAX_BLOCKS) errors['blocks'] = 'tooLong';

  d.fears.forEach((f, i) => {
    if (f.trim().length === 0) return;
    const e = validatePhrase(f);
    if (e) errors[`fears.${i}`] = e;
  });
  if (d.fears.filter((f) => f.trim().length > 0).length > MAX_FEARS) {
    errors['fears'] = 'tooLong';
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/** Builds the JSON-RPC body. Trims every phrase and drops empty fears. */
export function buildRequest(d: LadderDraft, id: number): JsonRpcRequest {
  return {
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: {
      name: 'analyze_ladder',
      arguments: {
        language: 'en',
        goal: d.goal.trim(),
        me: d.me.trim(),
        blocks: d.blocks.map((b) => b.trim()),
        fears: d.fears.map((f) => f.trim()).filter((f) => f.length > 0),
      },
    },
  };
}
