import type { ButtonHTMLAttributes, ReactNode } from "react";

type PublicButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

export default function PublicButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}: PublicButtonProps) {
  return (
    <button
      {...props}
      className={[
        "mem-public-button",
        `mem-public-button-${variant}`,
        `mem-public-button-${size}`,
        fullWidth ? "mem-public-button-full" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}