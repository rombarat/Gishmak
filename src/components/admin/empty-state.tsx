import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Flourish } from "@/components/ui/ornament";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  body,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  body?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-[6px] border border-dashed border-line bg-surface/60 px-6 py-12 text-center", className)}>
      <Icon className="size-8 text-gold" aria-hidden strokeWidth={1.6} />
      <p className="mt-3 font-display text-xl font-bold text-ink">{title}</p>
      <Flourish className="mt-2 text-gold/70" />
      {body && <div className="mt-2 max-w-sm text-[15px] text-ink-2">{body}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
