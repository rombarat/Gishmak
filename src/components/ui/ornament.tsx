import { cn } from "@/lib/utils";

/** The gold flourish from the shop's printed menu, drawn as a small inline SVG. */
export function Flourish({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 16"
      className={cn("h-3 w-12 shrink-0", className)}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M2 8h18" />
      <path d="M20 8c3-5 9-5 9 0s-6 4-6 1 4-3 5 0" />
      <circle cx="32" cy="8" r="1.8" fill="currentColor" stroke="none" />
      <path d="M44 8c-3-5-9-5-9 0s6 4 6 1-4-3-5 0" />
      <path d="M44 8h18" />
    </svg>
  );
}

/** Section heading flanked by rules + flourishes, as on the menu card. */
export function OrnamentHeading({
  children,
  as: Tag = "h2",
  tone = "light",
  className,
  id,
}: {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  tone?: "light" | "dark";
  className?: string;
  id?: string;
}) {
  const rule = tone === "dark" ? "bg-gold/50" : "bg-line";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={cn("h-px flex-1", rule)} />
      <Flourish className="text-gold" />
      <Tag
        id={id}
        className={cn("text-center font-display text-2xl font-bold sm:text-3xl", tone === "dark" ? "text-gold-bright" : "text-ink")}
      >
        {children}
      </Tag>
      <Flourish className="-scale-x-100 text-gold" />
      <span className={cn("h-px flex-1", rule)} />
    </div>
  );
}
