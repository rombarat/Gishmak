"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "הדפסה", variant = "outline" }: { label?: string; variant?: "outline" | "dark" | "gold" }) {
  return (
    <Button variant={variant} onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
