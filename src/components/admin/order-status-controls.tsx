"use client";

import { useOptimistic } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { NEXT_ACTION_LABEL, NEXT_STATUS, ORDER_STATUSES, STATUS_LABEL, isOrderStatus, type OrderStatus } from "@/domain/order-status";
import { setOrderStatusAction } from "@/app/admin/actions";
import { controlClass } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { useAction } from "./use-action";
import { orderRef } from "./format";

/**
 * Badge + one-tap "next step" + a select for any status (cancel asks first).
 * Optimistic: the badge flips immediately; the server result confirms or reverts it.
 */
export function OrderStatusControls({
  orderId,
  orderNumber,
  status,
  layout = "row",
  showBadge = true,
  showMenu = true,
  className,
}: {
  orderId: string;
  orderNumber: number;
  status: string;
  layout?: "row" | "stack" | "large";
  showBadge?: boolean;
  showMenu?: boolean;
  className?: string;
}) {
  const current: OrderStatus = isOrderStatus(status) ? status : "NEW";
  const [optimistic, setOptimistic] = useOptimistic(current);
  const { pending, run } = useAction();

  const change = (to: OrderStatus) => {
    if (to === optimistic) return;
    if (to === "CANCELLED" && !window.confirm(`לבטל את הזמנה ${orderRef(orderNumber)}? הלקוח לא יקבל הודעה אוטומטית.`)) return;
    run(
      async () => {
        setOptimistic(to);
        return setOrderStatusAction(orderId, to);
      },
      (r) => `הזמנה ${orderRef(orderNumber)}: הסטטוס עודכן ל"${r.label}"`,
    );
  };

  const next = NEXT_STATUS[optimistic];
  const nextLabel = NEXT_ACTION_LABEL[optimistic];
  const large = layout === "large";

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        layout === "stack" && "flex-col items-stretch",
        large && "flex-wrap",
        className,
      )}
    >
      {showBadge && <StatusBadge status={optimistic} className={cn(layout === "stack" && "self-start")} />}
      {next && nextLabel && (
        <button
          type="button"
          onClick={() => change(next)}
          disabled={pending}
          className={buttonClass(
            next === "PICKED_UP" ? "outline" : next === "READY" ? "dark" : "gold",
            large ? "lg" : "md",
            cn("min-w-28", layout === "stack" && "w-full"),
          )}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {nextLabel}
          {!pending && <ArrowLeft className="size-4" aria-hidden />}
        </button>
      )}
      {showMenu && (
      <label className={cn("relative", layout === "stack" && "w-full")}>
        <span className="sr-only">שינוי סטטוס להזמנה #{orderNumber}</span>
        <select
          value={optimistic}
          disabled={pending}
          onChange={(e) => change(e.target.value as OrderStatus)}
          className={controlClass(false, cn("w-auto pe-8 text-[14px] font-semibold", large && "min-h-13", layout === "stack" && "w-full"))}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "CANCELLED" && optimistic !== "CANCELLED" ? "ביטול ההזמנה…" : STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      )}
    </div>
  );
}
