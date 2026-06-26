import { useTranslation } from "react-i18next";
import { getBand } from "../storage";
import { Button } from "../components/ui/Button";
import { CTASection } from "../components/layout/CTASection";
import { TelegramIcon } from "../components/icons/TelegramIcon";

export function TelegramCTA() {
  const { t } = useTranslation();
  const band = getBand();

  return (
    <CTASection title={t("telegram.title")} subtitle={t("telegram.subtitle")}>
      <Button href={band.telegramChannel} variant="telegram">
        <TelegramIcon />
        {t("telegram.cta")}
      </Button>
    </CTASection>
  );
}
