import type { ReactNode } from "react";

interface DividerListProps {
  as?: "ul" | "ol";
  className?: string;
  children: ReactNode;
}

export function DividerList({ as: Tag = "ul", className = "", children }: DividerListProps) {
  return <Tag className={`divide-y divide-white/10 ${className}`}>{children}</Tag>;
}
