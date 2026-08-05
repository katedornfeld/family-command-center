import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 disabled:hover:bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:hover:bg-zinc-50",
  secondary:
    "border border-zinc-300 text-zinc-900 hover:bg-zinc-50 disabled:hover:bg-transparent dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:disabled:hover:bg-transparent",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
