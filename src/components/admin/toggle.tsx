"use client";

import { cn } from "@/lib/utils";

/**
 * Accessible switch (role="switch"). The whole label is the hit area (≥44px tall).
 * `tone` colors the "on" state: leaf for availability, tomato for "sold out", gold for featured.
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  tone = "leaf",
  hideLabel,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  tone?: "leaf" | "tomato" | "gold";
  hideLabel?: boolean;
  className?: string;
}) {
  const on = { leaf: "bg-leaf", tomato: "bg-tomato", gold: "bg-gold" }[tone];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={description ? `${label} — ${description}` : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "group inline-flex min-h-11 items-center gap-2.5 rounded-[6px] px-1.5 text-start transition-opacity disabled:opacity-50",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? on : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute size-5 rounded-full bg-surface shadow transition-[inset-inline-start] duration-150",
            checked ? "start-[1.375rem]" : "start-0.5",
          )}
        />
      </span>
      {!hideLabel && (
        <span className="flex flex-col leading-tight">
          <span className="text-[14px] font-bold text-ink">{label}</span>
          {description && <span className="text-[12px] text-ink-3">{description}</span>}
        </span>
      )}
    </button>
  );
}
