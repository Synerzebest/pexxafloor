// Remembers the last surface typed in the pack configurator, so going back to the
// pack choice (browser back button) keeps it. Stored per browser; storage may be unavailable.
const KEY = "pexx:lastSurface";

export function parseSurface(value: unknown): number | null {
  const surface = Number(value);
  return value !== "" && value !== null && Number.isFinite(surface) && surface > 0 ? surface : null;
}

export function readLastSurface(): number | null {
  try {
    return parseSurface(window.localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function saveLastSurface(surface: number) {
  if (parseSurface(surface) === null) return;
  try {
    window.localStorage.setItem(KEY, String(surface));
  } catch {
    // Private mode or blocked storage: nothing to remember
  }
}
