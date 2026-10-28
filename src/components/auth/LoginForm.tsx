import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuthActions } from "../../auth/hooks";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { GoogleIcon } from "../icons/GoogleIcon";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

// "link" — magic link by email (clients), "password" — admin fallback
type Mode = "link" | "password";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation();
  const { signInWithPassword, signInWithMagicLink, signInWithGoogle } = useAuthActions();
  const [mode, setMode] = useState<Mode>("link");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setSubmitting(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.signInFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (mode === "password") {
        await signInWithPassword(email, password);
        onSuccess?.();
      } else {
        await signInWithMagicLink(email);
        setLinkSentTo(email);
      }
    });
  };

  const toggleMode = () => {
    setMode((m) => (m === "link" ? "password" : "link"));
    setError(null);
  };

  if (linkSentTo) {
    return (
      <div className="space-y-6">
        <p className="text-white">{t("auth.linkSent", { email: linkSentTo })}</p>
        <button
          type="button"
          onClick={() => setLinkSentTo(null)}
          className={`${typography.eyebrowXs} ${interactive.accentHover}`}
        >
          {t("auth.useAnotherEmail")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        size="md"
        className="w-full"
        onClick={() => run(signInWithGoogle)}
        disabled={submitting}
      >
        <GoogleIcon />
        {t("auth.continueWithGoogle")}
      </Button>

      <div className={`flex items-center gap-4 ${typography.eyebrowXs} text-fg-muted`}>
        <span className="flex-1 border-t border-white/10" />
        {t("auth.or")}
        <span className="flex-1 border-t border-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label={t("auth.email")}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          required
        />

        {mode === "password" && (
          <label className="block">
            <span className="block mb-2 text-xs uppercase tracking-wider text-fg-muted">
              {t("auth.password")}
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 bg-bg border border-white/20 rounded-sm text-white focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                className="absolute inset-y-0 right-2 flex items-center text-fg-muted hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-sm p-3">
            {error}
          </p>
        )}

        <Button type="submit" size="md" className="w-full" disabled={submitting}>
          {submitting ? "..." : mode === "password" ? t("auth.signIn") : t("auth.sendLink")}
        </Button>
      </form>

      <button
        type="button"
        onClick={toggleMode}
        className={`block mx-auto ${typography.eyebrowXs} ${interactive.mutedHover}`}
      >
        {mode === "link" ? t("auth.usePassword") : t("auth.useMagicLink")}
      </button>
    </div>
  );
}
