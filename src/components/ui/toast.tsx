"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone; action?: { label: string; onClick: () => void } };
type Ctx = { toast: (message: string, opts?: { tone?: Tone; action?: Toast["action"] }) => void };

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children, bottomOffset = false }: { children: React.ReactNode; bottomOffset?: boolean }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback<Ctx["toast"]>((message, opts) => {
    const id = ++seq.current;
    // one at a time: a new message replaces the previous so toasts never pile up over content
    setItems([{ id, message, tone: opts?.tone ?? "success", action: opts?.action }]);
  }, []);
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4",
          bottomOffset ? "bottom-24 md:bottom-6" : "bottom-20 md:bottom-6",
        )}
      >
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, toast.action ? 5000 : 2800);
    return () => clearTimeout(t);
  }, [onDone, toast.action]);
  const Icon = toast.tone === "error" ? CircleAlert : toast.tone === "info" ? Info : Check;
  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex w-full max-w-sm animate-toast items-center gap-3 rounded-[6px] bg-night px-4 py-3 text-on-night shadow-pop"
    >
      <Icon className={cn("size-5 shrink-0", toast.tone === "error" ? "text-[#f19a90]" : "text-gold-bright")} aria-hidden />
      <span className="flex-1 text-[15px] font-semibold">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            onDone();
          }}
          className="rounded px-2 py-1 text-sm font-bold text-gold-bright underline-offset-4 hover:underline"
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={onDone} aria-label="סגירה" className="rounded p-1 text-on-night-2 hover:text-on-night">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.toast;
}
