import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "dark" | "ghost" | "outline" | "danger" | "quiet";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  gold: "bg-gold-bright text-night hover:bg-[#f0c463] active:bg-gold",
  dark: "bg-night text-on-night hover:bg-night-2",
  ghost: "bg-transparent text-ink hover:bg-surface-2",
  outline: "bg-surface text-ink border border-line hover:border-ink-3 hover:bg-surface-2",
  danger: "bg-tomato text-white hover:bg-[#8c2a19]",
  quiet: "bg-surface-2 text-ink hover:bg-line/70",
};
const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm gap-1.5",
  md: "min-h-11 px-4 text-[15px] gap-2",
  lg: "min-h-13 px-6 text-base gap-2",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
};

export const buttonClass = (variant: Variant = "gold", size: Size = "md", extra?: string) =>
  cn(
    "inline-flex items-center justify-center rounded-[6px] font-bold transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 select-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    extra,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "gold", size = "md", loading, block, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, cn(block && "w-full", className))}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
