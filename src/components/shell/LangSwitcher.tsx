import { useTranslation } from "react-i18next";
import type { Locale } from "../../types";
import { typography } from "../../styles/typography";

export function LangSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language as Locale;

  const toggle = (lng: Locale) => {
    void i18n.changeLanguage(lng);
  };

  return (
    <div className={`flex items-center gap-2 ${typography.eyebrowXs}`}>
      <button
        type="button"
        onClick={() => toggle("ru")}
        className={
          current === "ru" ? "text-white" : "text-fg-muted hover:text-white"
        }
      >
        RU
      </button>
      <span className="text-fg-muted">/</span>
      <button
        type="button"
        onClick={() => toggle("en")}
        className={
          current === "en" ? "text-white" : "text-fg-muted hover:text-white"
        }
      >
        EN
      </button>
    </div>
  );
}
