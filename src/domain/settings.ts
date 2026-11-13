export type Settings = { sound: boolean };

export const SETTINGS_KEY = 'haunted-ladder:settings';

/** Saves the sound choice. Never throws: if storage fails the app keeps working in memory. */
export function saveSettings(s: Settings, store: Storage): void {
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify({ sound: s.sound === true }));
  } catch {
    // private mode or quota: ignore
  }
}

/** Returns the saved settings, or { sound: false } when missing or broken. Never throws. */
export function loadSettings(store: Storage): Settings {
  try {
    const raw = store.getItem(SETTINGS_KEY);
    if (raw === null) return { sound: false };
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return { sound: false };
    return { sound: (v as Record<string, unknown>)['sound'] === true };
  } catch {
    return { sound: false };
  }
}
