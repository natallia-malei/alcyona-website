import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { NavLink } from "./NavLink";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-white/10 py-8">
      <Container className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-fg-muted">
        <p>{t("footer.rights")}</p>
        <NavLink to="/privacy">{t("footer.privacy")}</NavLink>
      </Container>
    </footer>
  );
}
