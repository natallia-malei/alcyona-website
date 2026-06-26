import type { ReactNode } from "react";
import { PageTitle } from "./PageTitle";

interface PageHeaderProps {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <PageTitle>{title}</PageTitle>
      {actions}
    </div>
  );
}
