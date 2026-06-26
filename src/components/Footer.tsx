import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-white/10 py-8">
      <Container className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[--color-fg-muted]">
        <p>{t("footer.rights")}</p>
        <Link to="/privacy" className="hover:text-white transition-colors">
          {t("footer.privacy")}
        </Link>
      </Container>
    </footer>
  );
}
