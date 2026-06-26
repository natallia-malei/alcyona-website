import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getBand } from "../storage";
import { SocialLinks } from "./SocialLinks";
import { LangSwitcher } from "./LangSwitcher";
import { Container } from "./Container";
import { NavLink } from "./NavLink";

export function Header() {
  const { t } = useTranslation();
  const band = getBand();

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-black/60 border-b border-white/10">
      <Container className="h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-bold text-xl tracking-[0.3em] hover:text-accent transition-colors"
        >
          ALCYONA
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest text-fg-muted">
          <NavLink href="/#new-album">{t("nav.newAlbum")}</NavLink>
          <NavLink href="/#releases">{t("nav.releases")}</NavLink>
          <NavLink href="/#photos">{t("nav.photos")}</NavLink>
          <NavLink href="/#videos">{t("nav.videos")}</NavLink>
          <NavLink to="/studio">{t("nav.studio")}</NavLink>
        </nav>

        <div className="flex items-center gap-6">
          <SocialLinks links={band.social} size="sm" />
          <LangSwitcher />
        </div>
      </Container>
    </header>
  );
}
