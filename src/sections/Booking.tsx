import { useTranslation } from "react-i18next";
import { getBand } from "../storage";
import { SocialLinks } from "../components/SocialLinks";
import { Container } from "../components/Container";
import { SectionTitle } from "../components/SectionTitle";

export function Booking() {
  const { t } = useTranslation();
  const band = getBand();

  return (
    <section id="booking" className="py-20 bg-[--color-bg-elevated]">
      <Container size="md" className="text-center">
        <SectionTitle className="mb-3">{t("booking.title")}</SectionTitle>
        <p className="text-[--color-fg-muted] mb-8">{t("booking.subtitle")}</p>
        <a
          href={`mailto:${band.bookingEmail}`}
          className="inline-block text-2xl md:text-3xl font-semibold underline underline-offset-8 hover:text-[--color-accent] transition-colors mb-10"
        >
          {band.bookingEmail}
        </a>
        <div className="flex justify-center">
          <SocialLinks links={band.social} size="lg" />
        </div>
      </Container>
    </section>
  );
}
