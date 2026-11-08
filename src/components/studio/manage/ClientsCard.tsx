import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Locale, StudioClient } from "../../../types";
import { setClientBlocked, setClientRole, setClientTrusted } from "../../../supabase/manage";
import { bookingErrorKey } from "../../../supabase/bookings";
import { personName } from "../../../utils/studioManage";
import { formatStudio } from "../../../utils/studioTime";
import { useConfirm } from "../../../hooks/useConfirm";
import { useToast } from "../../../hooks/useToast";
import { Button } from "../../ui/Button";
import { typography } from "../../../styles/typography";
import { ClientBadge } from "./ClientBadge";
import { ClientsHistory, type ClientHistory } from "./ClientsHistory";

interface ClientsCardProps {
  domId: string; // for scrollIntoView from ?client=…
  client: StudioClient;
  noShowLimit: number;
  highlighted: boolean;
  historyOpen: boolean;
  history: ClientHistory | null;
  historyVersion: number;
  onToggleHistory: (id: string) => void;
  onHistoryLoaded: (id: string, history: ClientHistory) => void;
  onChanged: () => void; // tab reloads after every action (or a failed attempt)
}

const DATE_PATTERN = "d MMM yyyy";

export function ClientsCard({
  domId,
  client: c,
  noShowLimit,
  highlighted,
  historyOpen,
  history,
  historyVersion,
  onToggleHistory,
  onHistoryLoaded,
  onChanged,
}: ClientsCardProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? "ru";
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const name = personName(c, t);
  const isAdmin = c.role === "admin";
  const isMember = c.role === "member";
  const isApplicant = c.role === "applicant"; // waits for approval, no studio access (018)
  const isClient = c.role === "client";
  // Members need only a name (017)
  const incomplete = !c.firstName || !c.lastName || (!isMember && !isAdmin && !c.phone);
  const telegram = c.telegramUsername.replace(/^@/, "");
  const historyDomId = `${domId}-history`;

  // Confirm → change → toast; the list reloads either way
  const runAction = async (
    message: string,
    danger: boolean,
    action: () => Promise<string>,
  ): Promise<void> => {
    const ok = await confirm({ message, variant: danger ? "danger" : "default" });
    if (!ok) return;

    setBusy(true);
    try {
      toast.success(await action());
    } catch (e) {
      toast.error(t(bookingErrorKey(e)));
    } finally {
      setBusy(false);
      onChanged();
    }
  };

  const handleTrust = () =>
    runAction(
      t(c.trusted ? "studio.manage.clients.untrustConfirm" : "studio.manage.clients.trustConfirm", {
        name,
      }),
      false,
      async () => {
        await setClientTrusted(c.id, !c.trusted);
        return t(
          c.trusted ? "studio.manage.clients.untrustedDone" : "studio.manage.clients.trustedDone",
        );
      },
    );

  const handleBand = () =>
    runAction(
      t(
        isMember
          ? "studio.manage.clients.removeFromBandConfirm"
          : "studio.manage.clients.addToBandConfirm",
        {
          name,
        },
      ),
      false,
      async () => {
        await setClientRole(c.id, isMember ? "client" : "member");
        return t(
          isMember ? "studio.manage.clients.removedFromBand" : "studio.manage.clients.addedToBand",
        );
      },
    );

  // Applicant → client ("Approve"), client → applicant ("Revoke access")
  const handleAccess = () =>
    runAction(
      t(
        isApplicant
          ? "studio.manage.clients.approveConfirm"
          : "studio.manage.clients.revokeAccessConfirm",
        { name },
      ),
      !isApplicant,
      async () => {
        await setClientRole(c.id, isApplicant ? "client" : "applicant");
        return t(
          isApplicant ? "studio.manage.clients.approved" : "studio.manage.clients.accessRevoked",
        );
      },
    );

  const handleBlock = () =>
    c.blocked
      ? runAction(t("studio.manage.clients.unblockConfirm", { name }), false, async () => {
          await setClientBlocked(c.id, false);
          return t("studio.manage.clients.unblockedDone");
        })
      : runAction(
          t("studio.manage.clients.blockConfirm", { name, count: c.upcomingCount }),
          true,
          async () => {
            const cancelled = await setClientBlocked(c.id, true);
            return t("studio.manage.clients.blockedDone", { count: cancelled });
          },
        );

  return (
    <li
      id={domId}
      className={`p-4 bg-bg-elevated border rounded-sm transition-shadow duration-500 ${
        c.blocked ? "border-red-900/60" : "border-white/10"
      } ${highlighted ? "ring-2 ring-accent" : ""}`}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-white font-semibold break-words">{name}</span>
            <ClientBadge client={c} />
          </div>
          {incomplete && (
            <p className="mt-0.5 text-xs text-amber-400">
              {t("studio.manage.clients.profileIncomplete")}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="text-fg hover:text-accent-hi break-all transition-colors"
              >
                {c.email}
              </a>
            )}
            {c.phone && (
              <a
                href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                className="text-fg hover:text-accent-hi tabular-nums transition-colors"
              >
                {c.phone}
              </a>
            )}
            {telegram && (
              <a
                href={`https://t.me/${telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg hover:text-accent-hi transition-colors"
              >
                @{telegram}
              </a>
            )}
          </div>

          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
            <li>{t("studio.manage.clients.upcoming", { count: c.upcomingCount })}</li>
            <li>{t("studio.manage.clients.attended", { count: c.attendedCount })}</li>
            {c.lastVisitAt && (
              <li>
                {t("studio.manage.clients.lastVisit", {
                  date: formatStudio(c.lastVisitAt, DATE_PATTERN, locale),
                })}
              </li>
            )}
            <li>
              {t("studio.manage.clients.since", {
                date: formatStudio(c.createdAt, DATE_PATTERN, locale),
              })}
            </li>
            {isClient && (
              <li className={c.noShowCount > 0 ? "text-red-400" : undefined}>
                {t("studio.manage.noShows", { count: c.noShowCount, limit: noShowLimit })}
              </li>
            )}
          </ul>
        </div>

        {!isAdmin && (
          <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch md:w-56 shrink-0">
            {isApplicant && (
              <Button size="sm" disabled={busy} onClick={() => void handleAccess()}>
                {t("studio.manage.clients.approve")}
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleBand()}>
              {t(
                isMember
                  ? "studio.manage.clients.removeFromBand"
                  : "studio.manage.clients.addToBand",
              )}
            </Button>
            {/* Trust only matters for renters; the band has no limits anyway */}
            {isClient && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void handleTrust()}
              >
                {t(c.trusted ? "studio.manage.clients.untrust" : "studio.manage.clients.trust")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void handleBlock()}
              className={
                c.blocked ? "" : "border-red-500/60! hover:border-red-400! hover:text-red-300!"
              }
            >
              {t(c.blocked ? "studio.manage.clients.unblock" : "studio.manage.clients.block")}
            </Button>
            {isClient && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void handleAccess()}
              >
                {t("studio.manage.clients.revokeAccess")}
              </Button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-expanded={historyOpen}
        aria-controls={historyDomId}
        onClick={() => onToggleHistory(c.id)}
        className={`mt-3 ${typography.eyebrowXs} text-[11px] text-accent hover:text-accent-hi transition-colors`}
      >
        {t(historyOpen ? "studio.manage.clients.hideHistory" : "studio.manage.clients.history")}
        <span aria-hidden="true" className="ml-1.5">
          {historyOpen ? "▴" : "▾"}
        </span>
      </button>

      {historyOpen && (
        <div id={historyDomId} className="mt-3 pt-3 border-t border-white/10">
          <ClientsHistory
            clientId={c.id}
            history={history}
            version={historyVersion}
            onLoaded={onHistoryLoaded}
          />
        </div>
      )}
    </li>
  );
}
