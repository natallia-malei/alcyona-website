import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBand } from "../../storage/hooks";
import { SocialLinks } from "./SocialLinks";
import { LangSwitcher } from "./LangSwitcher";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { Container } from "../layout/Container";
import { NavLink } from "../ui/NavLink";
import { MenuIcon } from "../icons/MenuIcon";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

export function Header() {
  const { t } = useTranslation();
  const band = useBand();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-black/60 border-b border-white/10">
        <Container className="h-16 flex items-center justify-between">
          <Logo />

          <nav className={`hidden md:flex items-center gap-8 ${typography.eyebrow} text-fg-muted`}>
            <NavLink href="/#new-album">{t("nav.newAlbum")}</NavLink>
            <NavLink to="/releases">{t("nav.releases")}</NavLink>
            <NavLink to="/photos">{t("nav.photos")}</NavLink>
            <NavLink to="/videos">{t("nav.videos")}</NavLink>
            <NavLink to="/studio">{t("nav.studio")}</NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <SocialLinks links={band.social} size="sm" />
            <LangSwitcher />
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label={t("nav.menuOpen")}
            aria-expanded={isMenuOpen}
            className={`md:hidden ${interactive.accentHover}`}
          >
            <MenuIcon />
          </button>
        </Container>
      </header>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
