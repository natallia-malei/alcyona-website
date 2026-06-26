import { useTranslation } from "react-i18next";
import { getBand } from "../storage";
import { Button } from "../components/Button";

export function TelegramCTA() {
  const { t } = useTranslation();
  const band = getBand();

  return (
    <section className="py-16 px-6 md:px-12 bg-[--color-bg-elevated]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          {t("telegram.title")}
        </h2>
        <p className="text-[--color-fg-muted] mb-6">{t("telegram.subtitle")}</p>
        <Button href={band.telegramChannel} variant="telegram">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.8 15.6 9.4 20c.6 0 .8-.2 1.1-.5l2.7-2.6 5.6 4.1c1 .6 1.7.3 2-.9l3.6-17c.3-1.5-.5-2.1-1.5-1.7L1.5 9.5C0 10 0 10.9 1.3 11.3l5.4 1.7L19.3 5c.6-.4 1.2-.2.7.2L9.8 15.6z" />
          </svg>
          {t("telegram.cta")}
        </Button>
      </div>
    </section>
  );
}
