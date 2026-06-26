import { useTranslation } from "react-i18next";
import { getBand } from "../storage";
import { SocialLinks } from "../components/SocialLinks";
import { CTASection } from "../components/CTASection";
import { BookingEmail } from "../components/BookingEmail";

export function Booking() {
  const { t } = useTranslation();
  const band = getBand();

  return (
    <CTASection id="booking" title={t("booking.title")} subtitle={t("booking.subtitle")}>
      <BookingEmail email={band.bookingEmail} />
      <div className="flex justify-center">
        <SocialLinks links={band.social} size="lg" />
      </div>
    </CTASection>
  );
}
