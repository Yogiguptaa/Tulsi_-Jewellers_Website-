import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "onDark";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-wide " +
  "transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-maroon text-offwhite hover:bg-maroon-700 active:bg-maroon-700 shadow-[0_10px_30px_-18px_rgb(90_15_27_/0.9)]",
  secondary:
    "border border-gold bg-transparent text-charcoal hover:bg-champagne/60",
  ghost: "text-charcoal hover:bg-champagne/50",
  dark: "bg-charcoal text-ivory hover:bg-charcoal/90",
  // Outlined button for a maroon or charcoal band. `secondary` cannot be used
  // there: it is charcoal-on-transparent, which is invisible on dark maroon.
  onDark: "border border-champagne/60 bg-transparent text-champagne hover:bg-maroon-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm sm:text-base",
  lg: "px-7 py-3.5 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
