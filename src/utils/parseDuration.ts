// Parse "m:ss" or "mm:ss" (or "h:mm:ss") to seconds. Returns null if invalid.
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(":").map((p) => p.trim());
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((p) => !/^\d+$/.test(p))) return null;

  const nums = parts.map(Number);
  if (nums.length === 2) {
    const [m, s] = nums;
    if (s >= 60) return null;
    return m * 60 + s;
  }
  const [h, m, s] = nums;
  if (m >= 60 || s >= 60) return null;
  return h * 3600 + m * 60 + s;
}
