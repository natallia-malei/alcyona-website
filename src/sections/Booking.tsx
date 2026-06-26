import { useTranslation } from "react-i18next";
import { getBand } from "../storage";
import { SocialLinks } from "../components/shell/SocialLinks";
import { CTASection } from "../components/layout/CTASection";
import { BookingEmail } from "../components/booking/BookingEmail";
import { flex } from "../styles/layouts";

export function Booking() {
  const { t } = useTranslation();
  const band = getBand();

  return (
    <CTASection id="booking" title={t("booking.title")} subtitle={t("booking.subtitle")}>
      <BookingEmail email={band.bookingEmail} />
      <div className={flex.center}>
        <SocialLinks links={band.social} size="lg" />
      </div>
    </CTASection>
  );
}
