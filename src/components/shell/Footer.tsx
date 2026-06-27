import { useTranslation } from "react-i18next";
import { Container } from "../layout/Container";
import { NavLink } from "../ui/NavLink";
import { typography } from "../../styles/typography";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-white/10 py-8">
      <Container className={`flex flex-col md:flex-row items-center justify-between gap-4 ${typography.caption}`}>
        <p>{t("footer.rights")}</p>
        <NavLink to="/privacy">{t("footer.privacy")}</NavLink>
      </Container>
    </footer>
  );
}
