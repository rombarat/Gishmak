"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClass } from "@/components/ui/button";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">משהו השתבש</h1>
      <p className="mt-2 text-ink-2">לא הצלחנו לטעון את הדף. הסל שלכם שמור — אפשר לנסות שוב.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>לנסות שוב</Button>
        <Link href="/" className={buttonClass("outline")}>
          לדף הבית
        </Link>
      </div>
    </div>
  );
}
