import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Eyebrow } from "./Eyebrow";
import { typography } from "../../styles/typography";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  /** Страница со всеми материалами раздела — ссылка «Все …» справа */
  to?: string;
  linkLabel?: string;
  /** Что-то справа вместо ссылки — например, обратный отсчёт */
  aside?: ReactNode;
}

/**
 * Спокойная шапка секции: eyebrow и заголовок слева, ссылка «Все →» справа.
 * Яркий заголовок с орнаментом остаётся одному месту на странице — перебивке релизов.
 */
export function SectionHeader({ eyebrow, title, to, linkLabel, aside }: SectionHeaderProps) {
  return (
    <div className="reveal mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div>
        <Eyebrow className="mb-3 text-accent">{eyebrow}</Eyebrow>
        <h2 className={`${typography.heading} text-4xl md:text-5xl`}>{title}</h2>
      </div>
      {aside}
      {to && linkLabel && (
        <Link
          to={to}
          className={`${typography.eyebrow} border-b border-accent/40 pb-1 text-accent transition-colors hover:border-accent-hi hover:text-accent-hi`}
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
