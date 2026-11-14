// Shared helper for Kiro hooks: Kiro sends the event as JSON on stdin.
export const readEvent = async () => {
  if (process.stdin.isTTY) return {};
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
};
