// Where to return after sign-in: /login?next=/studio → back to /studio.
// Only same-site paths are accepted ("//evil.com" or "https://…" fall back to "/").
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function loginPath(next: string): string {
  return next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
}
