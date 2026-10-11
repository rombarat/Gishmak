import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-[28px] font-bold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </header>
  );
}

/** Section title used inside admin pages — quiet, with the menu's thin rule. */
export function SectionTitle({ children, aside, className, id }: { children: React.ReactNode; aside?: React.ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn("mb-3 flex items-center gap-3", className)}>
      <h2 id={id} className="font-display text-xl font-bold text-ink">
        {children}
      </h2>
      <span className="h-px flex-1 bg-line" aria-hidden />
      {aside}
    </div>
  );
}

export function Card({ children, className, as: Tag = "section" }: { children: React.ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <Tag className={cn("rounded-[6px] border border-line bg-surface", className)}>{children}</Tag>;
}
