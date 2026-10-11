"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[6px] border bg-surface px-3.5 text-[16px] text-ink placeholder:text-ink-3 transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:bg-surface-2 disabled:text-ink-3";

export const controlClass = (error?: boolean, extra?: string) => cn(control, "min-h-11", error ? "border-tomato" : "border-line", extra);

type ShellProps = {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (id: string, describedBy?: string) => React.ReactNode;
};

export function FieldShell({ label, hint, error, optional, className, children }: ShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[15px] font-bold text-ink">
        {label}
        {optional && <span className="ms-1.5 text-sm font-medium text-ink-3">(לא חובה)</span>}
      </label>
      {children(id, [hintId, errId].filter(Boolean).join(" ") || undefined)}
      {hint && !error && (
        <p id={hintId} className="text-sm text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-sm font-semibold text-tomato">
          {error}
        </p>
      )}
    </div>
  );
}

type Common = { label: React.ReactNode; hint?: React.ReactNode; error?: string; optional?: boolean; wrapperClassName?: string };

export const TextField = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & Common>(function TextField(
  { label, hint, error, optional, wrapperClassName, className, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      {(id, describedBy) => (
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, "min-h-12", error ? "border-tomato" : "border-line", className)}
          {...rest}
        />
      )}
    </FieldShell>
  );
});

export const TextAreaField = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & Common>(
  function TextAreaField({ label, hint, error, optional, wrapperClassName, className, ...rest }, ref) {
    return (
      <FieldShell label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
        {(id, describedBy) => (
          <textarea
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(control, "min-h-24 py-3 leading-relaxed", error ? "border-tomato" : "border-line", className)}
            {...rest}
          />
        )}
      </FieldShell>
    );
  },
);

export const SelectField = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & Common>(function SelectField(
  { label, hint, error, optional, wrapperClassName, className, children, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      {(id, describedBy) => (
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, "min-h-12", error ? "border-tomato" : "border-line", className)}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
});
