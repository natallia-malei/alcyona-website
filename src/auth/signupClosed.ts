// Team mode (017): public sign-up is turned off in Supabase (Auth → "Allow new
// users to sign up"), so an email link or Google for an unknown address fails.
// These helpers recognise that error and show a clear message instead.

// Error from signInWithOtp / signInWithOAuth
export function isSignupClosedError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const { code, message } = e as { code?: unknown; message?: unknown };
  return (
    code === "signup_disabled" ||
    code === "otp_disabled" ||
    (typeof message === "string" && /signups? not allowed/i.test(message))
  );
}

// Google redirects back with ?error_code=signup_disabled (or in the #hash).
// Returns true and cleans the URL if that's the case.
export function takeSignupClosedFromUrl(): boolean {
  const { search, hash, pathname } = window.location;
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const code = params.get("error_code") ?? hashParams.get("error_code");
  const description = params.get("error_description") ?? hashParams.get("error_description") ?? "";
  if (code !== "signup_disabled" && !/signups? not allowed/i.test(description)) return false;

  for (const key of ["error", "error_code", "error_description"]) params.delete(key);
  const rest = params.toString();
  window.history.replaceState(null, "", `${pathname}${rest ? `?${rest}` : ""}`);
  return true;
}
