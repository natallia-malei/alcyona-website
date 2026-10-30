import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlcyonaWordmark } from "../icons/AlcyonaWordmark";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-7" }: LogoProps) {
  const { t } = useTranslation();
  return (
    <Link
      to="/"
      aria-label={t("nav.logo")}
      className="block text-fg transition-colors hover:text-accent-hi"
    >
      <AlcyonaWordmark className={`w-auto transition-[height] duration-300 ${className}`} />
    </Link>
  );
}
