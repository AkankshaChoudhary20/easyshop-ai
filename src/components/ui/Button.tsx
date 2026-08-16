import { type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

const VARIANTS = {
  primary: "es-btn-primary",
  secondary: "es-btn-secondary",
  ghost: "es-btn-ghost",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
}

export function Button({ variant = "primary", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={clsx(VARIANTS[variant], className)} {...rest} />;
}
