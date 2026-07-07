import type { ReactNode } from "react";

type PublicCardProps = {
  children: ReactNode;
  className?: string;
};

export default function PublicCard({
  children,
  className = "",
}: PublicCardProps) {
  return <div className={`mem-public-card ${className}`}>{children}</div>;
}