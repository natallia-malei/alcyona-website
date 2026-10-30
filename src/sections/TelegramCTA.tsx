import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBand, useStorageActions } from "../storage/hooks";
import { useIsAdmin } from "../auth/hooks";
import { Button } from "../components/ui/Button";
import { EditButton } from "../components/ui/EditButton";
import { Modal } from "../components/ui/Modal";
import { CTASection } from "../components/layout/CTASection";
import { TelegramChannelForm } from "../components/forms/TelegramChannelForm";
import { TelegramIcon } from "../components/icons/TelegramIcon";
import { Constellation } from "../components/fx/Constellation";

export function TelegramCTA() {
  const { t } = useTranslation();
  const band = useBand();
  const { updateBand } = useStorageActions();
  const isAdmin = useIsAdmin();
  const [editing, setEditing] = useState(false);

  const handleSave = async (telegramChannel: string) => {
    await updateBand({ ...band, telegramChannel });
    setEditing(false);
  };

  return (
    <>
      <CTASection
        id="pleiades"
        eyebrow={t("telegram.eyebrow")}
        decor={
          <Constellation className="absolute right-[3vw] top-1/2 -z-10 hidden w-[clamp(260px,24vw,380px)] -translate-y-1/2 xl:block" />
        }
        title={t("telegram.title")}
        subtitle={t("telegram.subtitle")}
        action={isAdmin ? <EditButton onClick={() => setEditing(true)} /> : undefined}
      >
        <Constellation className="mx-auto mb-8 w-56 xl:hidden" />
        <Button href={band.telegramChannel} variant="telegram" glow>
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
