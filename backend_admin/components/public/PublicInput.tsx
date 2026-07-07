import type { InputHTMLAttributes } from "react";

type PublicInputProps = InputHTMLAttributes<HTMLInputElement>;

export default function PublicInput({
  className = "",
  ...props
}: PublicInputProps) {
  return (
    <input
      {...props}
      className={`mem-public-input ${className}`}
    />
  );
}