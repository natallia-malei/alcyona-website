import { useTranslation } from "react-i18next";

const block = "rounded-sm bg-white/5 animate-pulse";

// Shape of the calendar while it loads, so the page doesn't jump when data arrives
export function CalendarSkeleton() {
  const { t } = useTranslation();

  return (
    <div aria-busy="true">
      <span className="sr-only">{t("app.loading")}</span>

      <div className="md:hidden space-y-4">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${block} shrink-0 w-14 h-16`} />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className={`${block} h-11`} />
          ))}
        </div>
      </div>

      <div className="hidden md:block space-y-4">
        <div className={`${block} h-9 w-72`} />
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: "3.5rem repeat(7, minmax(0, 1fr))" }}
        >
          {Array.from({ length: 8 * 10 }, (_, i) =>
            i % 8 === 0 ? <div key={i} /> : <div key={i} className={`${block} h-9`} />,
          )}
        </div>
      </div>
    </div>
  );
}
