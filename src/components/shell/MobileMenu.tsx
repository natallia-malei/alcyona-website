import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useBand } from "../../storage/hooks";
import { useAccount, useAuthActions, useAuthLoading } from "../../auth/hooks";
import { loginPath } from "../../auth/redirect";
import { NavLink } from "../ui/NavLink";
import { Avatar } from "../ui/Avatar";
import { SocialLinks } from "./SocialLinks";
import { LangSwitcher } from "./LangSwitcher";
import { CloseIcon } from "../icons/CloseIcon";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
}

export function MobileMenu({ isOpen, onClose, onOpenProfile }: MobileMenuProps) {
  const { t } = useTranslation();
  const band = useBand();
  const account = useAccount();
  const authLoading = useAuthLoading();
  const { pathname } = useLocation();
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
        {!authLoading &&
          (account ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar imageUrl={account.avatarUrl} initials={account.initials} />
                <span className="text-sm text-white">{account.name}</span>
              </div>
              <div className="flex items-center gap-6">
                <NavLink
                  variant="accent"
                  to="/studio#my-bookings"
                  onClick={onClose}
                  className={typography.eyebrow}
                >
                  {t("auth.myBookings")}
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className={`${typography.eyebrow} ${interactive.accentHover}`}
                >
                  {t("auth.profile")}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`${typography.eyebrow} ${interactive.accentHover}`}
                >
                  {t("auth.signOut")}
                </button>
              </div>
            </div>
          ) : (
            <NavLink
              variant="accent"
              to={loginPath(pathname)}
              onClick={onClose}
              className={typography.eyebrow}
            >
              {t("auth.signIn")}
            </NavLink>
          ))}
        <SocialLinks links={band.social} size="lg" />
        <LangSwitcher />
      </div>
    </div>
  );
}
