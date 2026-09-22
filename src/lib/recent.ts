// Саяхан үзсэн номын ID-ууд — localStorage, backend орохгүй.
const KEY = "gb-recent";
const MAX = 8;

export function getRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecent(id: string) {
  try {
    const cur = getRecent().filter((x) => x !== id).slice(0, MAX - 1);
    localStorage.setItem(KEY, JSON.stringify([id, ...cur]));
  } catch {
    /* ignore (private mode г.м) */
  }
}
