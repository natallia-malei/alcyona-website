/** «2026-11-15» → Date в местной полуночи (new Date("2026-11-15") дал бы полночь UTC). */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Сегодняшняя дата в формате «2026-11-15» по местному времени. */
export function todayKey(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
