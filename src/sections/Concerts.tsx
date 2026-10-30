import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Concert } from "../types";
import { useConcerts, useStorageActions } from "../storage/hooks";
import { useIsAdmin } from "../auth/hooks";
import { useConfirm } from "../hooks/useConfirm";
import { useLocalizedText } from "../hooks/useLocalizedText";
import { Container } from "../components/layout/Container";
import { SectionHeader } from "../components/ui/SectionHeader";
import { Button } from "../components/ui/Button";
import { Countdown } from "../components/ui/Countdown";
import { Modal } from "../components/ui/Modal";
import { ConcertForm } from "../components/forms/ConcertForm";
import { EditIcon } from "../components/icons/EditIcon";
import { CloseIcon } from "../components/icons/CloseIcon";
import { parseLocalDate, todayKey } from "../utils/localDate";
import { typography } from "../styles/typography";

const ARCHIVE_LIMIT = 6;

type Editing = { concert?: Concert } | null;

export function Concerts() {
  const { t, i18n } = useTranslation();
  const tr = useLocalizedText();
  const concerts = useConcerts();
  const { upsertConcert, deleteConcert } = useStorageActions();
  const isAdmin = useIsAdmin();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Editing>(null);

  const today = todayKey();
  const upcoming = concerts.filter((c) => c.date >= today);
  const past = concerts
    .filter((c) => c.date < today)
    .reverse()
    .slice(0, ARCHIVE_LIMIT);
  const next = upcoming.find((c) => c.status !== "cancelled");

  const day = new Intl.DateTimeFormat(i18n.language, { day: "2-digit" });
  const monthYear = new Intl.DateTimeFormat(i18n.language, { month: "short", year: "numeric" });
  const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: "short" });
  const shortDate = new Intl.DateTimeFormat(i18n.language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleSave = async (concert: Concert) => {
    await upsertConcert(concert);
    setEditing(null);
  };

  const handleDelete = async (concert: Concert) => {
    const ok = await confirm({ message: t("concerts.deleteConfirm"), variant: "danger" });
    if (ok) await deleteConcert(concert.id);
  };

  const adminControls = (concert: Concert) =>
    isAdmin && (
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setEditing({ concert })}
          aria-label={t("concerts.edit")}
          className="p-2 text-fg-muted transition-colors hover:text-accent-hi"
        >
          <EditIcon />
        </button>
        <button
          type="button"
          onClick={() => handleDelete(concert)}
          aria-label={t("concerts.delete")}
          className="p-2 text-fg-muted transition-colors hover:text-accent-hi"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    );

  // Секция видна всегда: даже без дат она зовёт подписаться на анонсы
  return (
    <section id="concerts" className="py-24">
      <Container>
        <SectionHeader
          eyebrow={t("concerts.eyebrow")}
          title={t("concerts.title")}
          aside={next && <Countdown to={next.date} label={t("concerts.untilNext")} />}
        />

        {upcoming.length > 0 ? (
          <ul className="border-b border-line">
            {upcoming.map((c) => {
              const date = parseLocalDate(c.date);
              const cancelled = c.status === "cancelled";
              return (
                <li
                  key={c.id}
                  className="reveal grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-4 border-t border-line py-6 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  <div className="w-20 text-center md:w-24">
                    <div className="font-display text-5xl font-semibold leading-none lining-nums text-accent-hi">
                      {day.format(date)}
                    </div>
                    <div className={`mt-2 ${typography.eyebrowXs} text-fg-muted`}>
                      {monthYear.format(date)}
                    </div>
                  </div>

                  <div className={cancelled ? "opacity-50" : ""}>
                    <h3
                      className={`font-display text-2xl font-semibold md:text-3xl ${cancelled ? "line-through" : ""}`}
                    >
                      {tr(c.city)}
                    </h3>
                    <p className="mt-1 text-sm">
                      {c.venue} · <span className="capitalize">{weekday.format(date)}</span>
                      {c.time && ` · ${c.time}`}
                    </p>
                  </div>

                  <div className="col-span-2 flex flex-wrap items-center gap-3 md:col-span-1 md:justify-end">
                    {c.status === "on_sale" && c.ticketUrl && (
                      <Button href={c.ticketUrl} size="sm">
                        {t("concerts.tickets")}
                      </Button>
                    )}
                    {c.status === "on_sale" && c.vipUrl && (
                      <Button href={c.vipUrl} size="sm" variant="outline">
                        {t("concerts.vip")}
                      </Button>
                    )}
                    {c.status !== "on_sale" && (
                      <span
                        className={`border px-3 py-2 ${typography.eyebrowXs} ${
                          c.status === "sold_out"
                            ? "border-ember/70 text-[#e98b7c]"
                            : "border-line text-fg-muted"
                        }`}
                      >
                        {t(`concerts.status.${c.status}`)}
                      </span>
                    )}
                    {adminControls(c)}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="reveal max-w-xl border-y border-line py-8 text-lg">
            {t("concerts.empty")}{" "}
            <a href="#pleiades" className="text-accent-hi underline-offset-4 hover:underline">
              {t("concerts.emptyLink")}
            </a>
            .
          </p>
        )}

        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setEditing({})} className="mt-6">
            + {t("concerts.add")}
          </Button>
        )}

        {past.length > 0 && (
          <div className="mt-16">
            <h3 className={`${typography.eyebrow} mb-4 text-fg-muted`}>{t("concerts.archive")}</h3>
            <ul>
              {past.map((c) => (
                <li
                  key={c.id}
                  className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-4 border-t border-line/60 py-3 text-sm"
                >
                  <span className="font-mono tabular-nums text-fg-muted">
                    {shortDate.format(parseLocalDate(c.date))}
                  </span>
                  <span className="truncate">
                    <span className="font-display text-lg text-fg">{tr(c.city)}</span>
                    <span className="text-fg-muted"> · {c.venue}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {c.videoUrl && (
                      <a
                        href={c.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${typography.eyebrowXs} text-accent transition-colors hover:text-accent-hi`}
                      >
                        ▶ {t("concerts.video")}
                      </a>
                    )}
                    {adminControls(c)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.concert ? t("concerts.edit") : t("concerts.add")}
      >
        {editing && (
          <ConcertForm
            initialConcert={editing.concert}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </section>
  );
}
