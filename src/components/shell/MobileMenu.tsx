import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBand } from "../../storage/hooks";
import { useAuthActions, useIsAuthenticated } from "../../auth/hooks";
import { NavLink } from "../ui/NavLink";
import { SocialLinks } from "./SocialLinks";
import { LangSwitcher } from "./LangSwitcher";
import { CloseIcon } from "../icons/CloseIcon";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { t } = useTranslation();
  const band = useBand();
  const isAuth = useIsAuthenticated();
  const { signOut } = useAuthActions();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-60 bg-bg flex flex-col">
      <div className="flex justify-end p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("nav.menuClose")}
          className={interactive.accentHover}
        >
          <CloseIcon />
        </button>
      </div>

      <nav
        className={`flex-1 flex flex-col items-center justify-center gap-8 text-3xl text-white ${typography.heading}`}
      >
        <NavLink variant="accent" href="/#new-album" onClick={onClose}>
          {t("nav.newAlbum")}
        </NavLink>
        <NavLink variant="accent" to="/releases" onClick={onClose}>
          {t("nav.releases")}
        </NavLink>
        <NavLink variant="accent" to="/photos" onClick={onClose}>
          {t("nav.photos")}
        </NavLink>
        <NavLink variant="accent" to="/videos" onClick={onClose}>
          {t("nav.videos")}
        </NavLink>
        <NavLink variant="accent" to="/studio" onClick={onClose}>
          {t("nav.studio")}
        </NavLink>
      </nav>

      <div className="flex flex-col items-center gap-6 p-8">
        <SocialLinks links={band.social} size="lg" />
        <LangSwitcher />
        {isAuth && (
          <button
            type="button"
            onClick={handleSignOut}
            className={`${typography.eyebrow} ${interactive.accentHover}`}
          >
            {t("auth.signOut")}
          </button>
        )}
      </div>
    </div>
  );
}
