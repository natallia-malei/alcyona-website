import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Locale, StudioTelegram } from "../../../types";
import { bookingErrorKey } from "../../../supabase/bookings";
import {
  createTelegramConnectCode,
  disconnectTelegram,
  fetchTelegramStatus,
  sendTelegramTest,
} from "../../../supabase/manage";
import { formatStudio } from "../../../utils/studioTime";
import { useConfirm } from "../../../hooks/useConfirm";
import { useToast } from "../../../hooks/useToast";
import { Button } from "../../ui/Button";
import { typography } from "../../../styles/typography";

// While a code waits for "/connect" in the group, check every few seconds
const POLL_MS = 4000;

// Settings → Telegram: connect the band's group topic, send a test, disconnect
export function SettingsTelegram() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const toast = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState<StudioTelegram | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    fetchTelegramStatus().then(
      (next) => {
        if (id === requestId.current) setStatus(next);
      },
      (e: unknown) => console.error("Failed to load Telegram status", e),
    );
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);

  const waiting =
    status !== null &&
    !status.connected &&
    status.connectCode !== null &&
    status.connectCodeExpiresAt !== null &&
    status.connectCodeExpiresAt > new Date();

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(timer);
  }, [waiting, load]);

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(t(success));
      load();
    } catch (e) {
      toast.error(t(bookingErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    const ok = await confirm({
      message: t("studio.manage.telegram.disconnectConfirm"),
      variant: "danger",
    });
    if (ok) await run(disconnectTelegram, "studio.manage.telegram.disconnected");
  };

  const command =
    status?.connectCode && status.botUsername
      ? `/connect@${status.botUsername} ${status.connectCode}`
      : "";

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the command is on screen to copy by hand
    }
  };

  return (
    <section className="flex flex-col gap-4 pt-8 border-t border-white/10">
      <h3 className={`${typography.eyebrow} text-accent`}>{t("studio.manage.telegram.title")}</h3>
      <p className={typography.caption}>{t("studio.manage.telegram.hint")}</p>

      {status === null ? (
        <div className="h-10 w-64 rounded-sm bg-white/5 animate-pulse" aria-hidden />
      ) : !status.botUsername ? (
        <p className="text-sm text-amber-400">{t("studio.manage.telegram.notSetUp")}</p>
      ) : status.connected ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white">
            <span className="text-accent">● </span>
            {t("studio.manage.telegram.connected", { chat: status.chatTitle ?? "—" })}
            {status.threadId !== null && (
              <span className="text-fg-muted"> · {t("studio.manage.telegram.connectedTopic")}</span>
            )}
            {status.connectedAt && (
              <span className="text-fg-muted">
                {" · "}
                {t("studio.manage.telegram.connectedSince", {
                  date: formatStudio(status.connectedAt, "d MMM yyyy", locale),
                })}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void run(sendTelegramTest, "studio.manage.telegram.testSent")}
            >
              {t("studio.manage.telegram.test")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void handleDisconnect()}
            >
              {t("studio.manage.telegram.disconnect")}
            </Button>
          </div>
        </div>
      ) : waiting && status.connectCodeExpiresAt ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white">
            {t("studio.manage.telegram.steps", { bot: status.botUsername })}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <code className="px-3 py-2 bg-bg border border-white/20 rounded-sm text-white font-mono text-sm select-all">
              {command}
            </code>
            <Button size="sm" variant="outline" onClick={() => void copyCommand()}>
              {t(copied ? "studio.manage.telegram.copied" : "studio.manage.telegram.copy")}
            </Button>
          </div>
          <p className={typography.caption}>
            {t("studio.manage.telegram.codeExpires", {
              time: formatStudio(status.connectCodeExpiresAt, "HH:mm", locale),
            })}
          </p>
          <div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void run(createTelegramConnectCode)}
            >
              {t("studio.manage.telegram.newCode")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-fg-muted">{t("studio.manage.telegram.notConnected")}</p>
          <Button size="sm" disabled={busy} onClick={() => void run(createTelegramConnectCode)}>
            {t("studio.manage.telegram.connect")}
          </Button>
        </div>
      )}
    </section>
  );
}
