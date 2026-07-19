import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBand, useStorageActions } from "../storage/hooks";
import { useIsAuthenticated } from "../auth/hooks";
import { Button } from "../components/ui/Button";
import { EditButton } from "../components/ui/EditButton";
import { Modal } from "../components/ui/Modal";
import { CTASection } from "../components/layout/CTASection";
import { TelegramChannelForm } from "../components/forms/TelegramChannelForm";
import { TelegramIcon } from "../components/icons/TelegramIcon";

export function TelegramCTA() {
  const { t } = useTranslation();
  const band = useBand();
  const { updateBand } = useStorageActions();
  const isAuth = useIsAuthenticated();
  const [editing, setEditing] = useState(false);

  const handleSave = async (telegramChannel: string) => {
    await updateBand({ ...band, telegramChannel });
    setEditing(false);
  };

  return (
    <>
      <CTASection
        title={t("telegram.title")}
        subtitle={t("telegram.subtitle")}
        action={isAuth ? <EditButton onClick={() => setEditing(true)} /> : undefined}
      >
        <Button href={band.telegramChannel} variant="telegram">
          <TelegramIcon />
          {t("telegram.cta")}
        </Button>
      </CTASection>

      <Modal open={editing} onClose={() => setEditing(false)} title={t("telegram.editTitle")}>
        <TelegramChannelForm
          initialValue={band.telegramChannel}
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </>
  );
}
