import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { BandInfo } from "../types";
import { useBand, useStorageActions } from "../storage/hooks";
import { useIsAuthenticated } from "../auth/hooks";
import { SocialLinks } from "../components/shell/SocialLinks";
import { CTASection } from "../components/layout/CTASection";
import { BookingEmail } from "../components/booking/BookingEmail";
import { EditButton } from "../components/ui/EditButton";
import { Modal } from "../components/ui/Modal";
import { BookingContactsForm } from "../components/forms/BookingContactsForm";
import { flex } from "../styles/layouts";

export function Booking() {
  const { t } = useTranslation();
  const band = useBand();
  const { updateBand } = useStorageActions();
  const isAuth = useIsAuthenticated();
  const [editing, setEditing] = useState(false);

  const handleSave = async (next: BandInfo) => {
    await updateBand(next);
    setEditing(false);
  };

  return (
    <>
      <CTASection
        id="booking"
        title={t("booking.title")}
        subtitle={t("booking.subtitle")}
        action={isAuth ? <EditButton onClick={() => setEditing(true)} /> : undefined}
      >
        <BookingEmail email={band.bookingEmail} />
        <div className={flex.center}>
          <SocialLinks links={band.social} size="lg" />
        </div>
      </CTASection>

      <Modal open={editing} onClose={() => setEditing(false)} title={t("booking.editTitle")}>
        <BookingContactsForm
          initialBand={band}
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </>
  );
}
