import type { ReactNode } from "react";
import { PageTitle } from "../ui/PageTitle";
import { Eyebrow } from "../ui/Eyebrow";
import { Ornament } from "../ui/Ornament";

interface PageHeaderProps {
  title: ReactNode;
  /** Строка над заголовком — как у секций на главной */
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, eyebrow, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && <Eyebrow className="mb-3 text-accent">{eyebrow}</Eyebrow>}
        <PageTitle>{title}</PageTitle>
        <Ornament className="mt-4" />
      </div>
      {actions}
    </div>
  );
}
