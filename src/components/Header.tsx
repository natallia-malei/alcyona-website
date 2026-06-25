import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getBand } from "../storage";
import { SocialLinks } from "./SocialLinks";
import { LangSwitcher } from "./LangSwitcher";

export function Header() {
  const { t } = useTranslation();
  const band = getBand();

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-black/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-bold text-xl tracking-[0.3em] hover:text-[--color-accent] transition-colors"
        >
          ALCYONA
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest text-[--color-fg-muted]">
          <a href="/#new-album" className="hover:text-white transition-colors">
            {t("nav.newAlbum")}
          </a>
          <a href="/#releases" className="hover:text-white transition-colors">
            {t("nav.releases")}
          </a>
          <a href="/#photos" className="hover:text-white transition-colors">
            {t("nav.photos")}
          </a>
          <a href="/#videos" className="hover:text-white transition-colors">
            {t("nav.videos")}
          </a>
          <Link to="/studio" className="hover:text-white transition-colors">
            {t("nav.studio")}
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <SocialLinks links={band.social} size="sm" />
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
