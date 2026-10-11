"use client";

import { controlClass } from "@/components/ui/field";

/** Styled inputs that server components can render (controlClass lives in a client module). */
export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={controlClass(false, className)} {...rest} />;
}

export function Select({ className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={controlClass(false, className)} {...rest} />;
}
