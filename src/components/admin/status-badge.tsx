import { Ban, CheckCheck, ChefHat, CircleCheck, PackageCheck, Sparkles } from "lucide-react";
import { STATUS_LABEL, isOrderStatus, type OrderStatus } from "@/domain/order-status";
import { cn } from "@/lib/utils";

/** Color + icon + text — status is never conveyed by color alone. */
export const STATUS_STYLE: Record<OrderStatus, { cls: string; Icon: typeof Sparkles }> = {
  NEW: { cls: "bg-amber-soft text-amber ring-amber/25", Icon: Sparkles },
  CONFIRMED: { cls: "bg-sky-soft text-sky ring-sky/25", Icon: CircleCheck },
  PREPARING: { cls: "bg-gold-soft text-gold-ink ring-gold/40", Icon: ChefHat },
  READY: { cls: "bg-leaf-soft text-leaf ring-leaf/25", Icon: PackageCheck },
  PICKED_UP: { cls: "bg-surface-2 text-ink-2 ring-ink-3/25", Icon: CheckCheck },
  CANCELLED: { cls: "bg-tomato-soft text-tomato ring-tomato/25", Icon: Ban },
};

export function StatusBadge({ status, className, size = "md" }: { status: string; className?: string; size?: "sm" | "md" }) {
  const s = isOrderStatus(status) ? status : "NEW";
  const { cls, Icon } = STATUS_STYLE[s];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-bold ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-[13px]",
        cls,
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden strokeWidth={2.4} />
      {STATUS_LABEL[s]}
    </span>
  );
}
