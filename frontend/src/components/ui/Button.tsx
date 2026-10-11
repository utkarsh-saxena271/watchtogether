import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-sans font-medium leading-none transition-opacity duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  const sizes = {
    sm: "h-8 px-3 text-[13px] rounded-[4px] min-w-[44px]",
    md: "h-10 px-4 text-[14px] rounded-[5px] min-w-[44px]",
  };

  const variants = {
    primary:
      "bg-[var(--text)] text-[var(--bg)] hover:opacity-85 active:opacity-70",
    secondary:
      "border border-[var(--line)] bg-transparent text-[var(--text)] hover:border-[var(--muted)] active:opacity-70",
    ghost:
      "bg-transparent text-[var(--muted)] hover:text-[var(--text)] active:opacity-70",
    danger:
      "border border-[var(--danger)] bg-transparent text-[var(--danger)] hover:opacity-85 active:opacity-70",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
