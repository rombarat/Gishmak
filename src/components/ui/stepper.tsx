"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * + / − control. In RTL the "+" sits on the right (start) where the thumb lands first.
 * At quantity 1 the minus becomes a trash icon so removal is explicit.
 */
export function QuantityStepper({
  value,
  onChange,
  max = 50,
  size = "md",
  label,
  tone = "light",
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  size?: "sm" | "md";
  label: string;
  tone?: "light" | "gold";
}) {
  const btn = size === "sm" ? "size-9" : "size-11";
  const removing = value <= 1;
  return (
    <div
      role="group"
      aria-label={`כמות: ${label}`}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border",
        tone === "gold" ? "border-gold bg-gold-soft" : "border-line bg-surface",
      )}
    >
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`הוספת יחידה: ${label}`}
        className={cn(btn, "grid place-items-center rounded-full text-ink transition-colors hover:bg-black/5 disabled:opacity-40")}
      >
        <Plus className="size-4" strokeWidth={2.4} />
      </button>
      <span className={cn("num min-w-7 text-center font-extrabold", size === "sm" ? "text-[15px]" : "text-base")}>{value}</span>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label={removing ? `הסרה מהסל: ${label}` : `הפחתת יחידה: ${label}`}
        className={cn(btn, "grid place-items-center rounded-full transition-colors hover:bg-black/5", removing ? "text-tomato" : "text-ink")}
      >
        {removing ? <Trash2 className="size-4" /> : <Minus className="size-4" strokeWidth={2.4} />}
      </button>
    </div>
  );
}
