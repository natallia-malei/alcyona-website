import { useTranslation } from "react-i18next";
import { getBand } from "../storage";
import { SocialLinks } from "../components/SocialLinks";

export function Booking() {
  const { t } = useTranslation();
  const band = getBand();

  return (
    <section id="booking" className="py-20 px-6 md:px-12 bg-[--color-bg-elevated]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-3">
          {t("booking.title")}
        </h2>
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
      </div>
    </section>
  );
}
