import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useBand } from "../../storage/hooks";
import { useAuthLoading, useIsAuthenticated } from "../../auth/hooks";
import { loginPath } from "../../auth/redirect";
import { SocialLinks } from "./SocialLinks";
import { LangSwitcher } from "./LangSwitcher";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { UserMenu } from "./UserMenu";
import { ProfileModal } from "../auth/ProfileModal";
import { Container } from "../layout/Container";
import { NavLink } from "../ui/NavLink";
import { MenuIcon } from "../icons/MenuIcon";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";
import { useScrolled } from "../../hooks/useScrolled";

export function Header() {
  const { t } = useTranslation();
  const band = useBand();
  const isAuth = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const scrolled = useScrolled();

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 border-b transition-colors duration-500 ${
          scrolled ? "bg-bg/85 backdrop-blur-md border-line" : "bg-transparent border-transparent"
        }`}
      >
        <Container
          className={`flex items-center justify-between transition-[height] duration-300 ${
            scrolled ? "h-16" : "h-20"
          }`}
        >
          <Logo className={scrolled ? "h-6" : "h-8"} />

          <nav className={`hidden lg:flex items-center gap-7 ${typography.eyebrow} text-fg/80`}>
            <NavLink href="/#new-album">{t("nav.newAlbum")}</NavLink>
            <NavLink to="/releases">{t("nav.releases")}</NavLink>
            <NavLink href="/#concerts">{t("nav.concerts")}</NavLink>
            <NavLink to="/videos">{t("nav.videos")}</NavLink>
            <NavLink to="/photos">{t("nav.photos")}</NavLink>
            <NavLink to="/studio">{t("nav.studio")}</NavLink>
          </nav>

          <div className="hidden lg:flex items-center gap-6">
            <SocialLinks links={band.social} size="sm" />
            <LangSwitcher />
            {/* Nothing while the session loads — avoids a "Sign in" flash */}
            {!authLoading &&
              (isAuth ? (
                <UserMenu onOpenProfile={() => setIsProfileOpen(true)} />
              ) : (
                <NavLink variant="accent" to={loginPath(pathname)} className={typography.eyebrow}>
                  {t("auth.signIn")}
                </NavLink>
              ))}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label={t("nav.menuOpen")}
            aria-expanded={isMenuOpen}
            className={`lg:hidden ${interactive.accentHover}`}
          >
            <MenuIcon />
          </button>
        </Container>
      </header>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />
      <ProfileModal open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
