import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-white/10 py-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[--color-fg-muted]">
        <p>{t("footer.rights")}</p>
        <Link to="/privacy" className="hover:text-white transition-colors">
          {t("footer.privacy")}
        </Link>
      </div>
    </footer>
  );
}
