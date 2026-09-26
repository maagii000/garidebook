// Профайл туслах: нас бодох + нийтэд харагдах нэр.

// YYYY-MM-DD → нас (буруу формат бол null)
export function ageOf(birthDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birthDate || "").trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const thisYear = new Date(now.getFullYear(), mo - 1, d);
  if (now < thisYear) age--;
  if (age < 0 || age > 120) return null;
  return age;
}

// Нийтэд харагдах нэр: nickname → овог нэр → "Хэрэглэгч" (имэйл хэзээ ч үгүй)
export function publicName(u: {
  nickname?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  name?: string | null;
}): string {
  if (u.nickname?.trim()) return u.nickname.trim();
  const full = `${u.lastName ?? ""} ${u.firstName ?? ""}`.trim();
  if (full) return full;
  return "Хэрэглэгч";
}
