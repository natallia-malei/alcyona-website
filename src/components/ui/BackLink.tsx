import type { MouseEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { typography } from "../../styles/typography";
import { interactive } from "../../styles/interactive";

interface BackLinkProps {
  /** Куда вести, если посетитель пришёл на страницу извне (по прямой ссылке) */
  fallback: string;
  children: ReactNode;
}

/** «← Назад»: возвращает туда, откуда пришли, — на то же место страницы. */
export function BackLink({ fallback, children }: BackLinkProps) {
  const navigate = useNavigate();
  // У первой открытой страницы ключ "default" — истории внутри сайта ещё нет
  const hasHistory = useLocation().key !== "default";

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!hasHistory) return;
    e.preventDefault();
    navigate(-1);
  };

  return (
    <Link
      to={fallback}
      onClick={handleClick}
      className={`${typography.eyebrow} ${interactive.mutedHover}`}
    >
      ← {children}
    </Link>
  );
}
