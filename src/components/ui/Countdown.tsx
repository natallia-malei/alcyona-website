import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseLocalDate } from "../../utils/localDate";

interface CountdownProps {
  /** Дата события: «2026-11-15» (полночь по местному времени) или полный ISO с временем */
  to: string;
  label: string;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function parseTarget(value: string): number {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseLocalDate(value).getTime()
    : new Date(value).getTime();
}

/** Обратный отсчёт до даты. Когда дата прошла, исчезает и перестаёт тикать. */
export function Countdown({ to, label, className = "" }: CountdownProps) {
  const { t } = useTranslation();
  const target = parseTarget(to);
  const [now, setNow] = useState(() => Date.now());
  const left = Math.floor((target - now) / 1000);
  const running = Number.isFinite(left) && left > 0;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  if (!running) return null;

  const cells = [
    { value: Math.floor(left / 86400), unit: t("countdown.days") },
    { value: Math.floor((left % 86400) / 3600), unit: t("countdown.hours") },
    { value: Math.floor((left % 3600) / 60), unit: t("countdown.minutes") },
    { value: left % 60, unit: t("countdown.seconds") },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-accent">{label}</span>
      <div className="flex gap-2" role="timer" aria-label={label}>
        {cells.map(({ value, unit }) => (
          <div
            key={unit}
            className="min-w-14 border border-line bg-bg/60 px-2 pb-1.5 pt-2 text-center"
          >
            <b className="block font-display text-2xl leading-none lining-nums tabular-nums">
              {pad(value)}
            </b>
            <small className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
              {unit}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
