"use client";

import { useCallback, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";

const NETWORK_ERROR = "אין חיבור לשרת. בדקו את האינטרנט ונסו שוב.";

/**
 * Runs a server action inside a transition and toasts the outcome.
 * `success` may be a message or a function of the result; return null to stay silent.
 */
export function useAction() {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    <T extends object>(
      action: () => Promise<ActionResult<T>>,
      success?: string | ((r: { ok: true } & T) => string | null),
      onDone?: (r: ActionResult<T>) => void,
    ) => {
      startTransition(async () => {
        let r: ActionResult<T>;
        try {
          r = await action();
        } catch {
          r = { ok: false, error: NETWORK_ERROR };
        }
        if (r.ok) {
          const msg = typeof success === "function" ? success(r) : success;
          if (msg) toast(msg);
        } else {
          toast(r.error, { tone: "error" });
        }
        onDone?.(r);
      });
    },
    [toast],
  );

  return { pending, run };
}
