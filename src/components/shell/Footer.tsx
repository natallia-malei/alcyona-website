import { useTranslation } from "react-i18next";
import { useBand } from "../../storage/hooks";
import { Container } from "../layout/Container";
import { NavLink } from "../ui/NavLink";
import { Ornament } from "../ui/Ornament";
import { AlcyonaWordmark } from "../icons/AlcyonaWordmark";
import { SocialLinks } from "./SocialLinks";
import { typography } from "../../styles/typography";

export function Footer() {
  const { t } = useTranslation();
  const band = useBand();

  return (
    <footer className="border-t border-line/60 pt-14 pb-10">
      <Container className="flex flex-col items-center gap-6 text-center">
        <AlcyonaWordmark className="h-8 w-auto text-fg/90" />
        <Ornament align="center" />
        <SocialLinks links={band.social} size="md" />
        <div
          className={`mt-4 flex w-full flex-col items-center justify-between gap-3 border-t border-line/40 pt-6 md:flex-row ${typography.caption}`}
        >
          <p>{t("footer.rights")}</p>
          <NavLink to="/privacy">{t("footer.privacy")}</NavLink>
        </div>
      </Container>
    </footer>
  );
}
