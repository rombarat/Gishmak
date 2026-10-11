import { cn } from "@/lib/utils";

/** Product thumbnail, or an initials tile (the printed-menu look) when there is no photo. */
export function ProductThumb({ name, imageUrl, className }: { name: string; imageUrl: string | null; className?: string }) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails incl. runtime uploads; no optimisation needed
      <img src={imageUrl} alt="" loading="lazy" className={cn("size-14 shrink-0 rounded-[6px] border border-line object-cover", className)} />
    );
  }
  const initials = name
    .replace(/["׳״']/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span aria-hidden className={cn("grid size-14 shrink-0 place-items-center rounded-[6px] border border-gold/40 bg-night font-display text-lg font-bold text-gold-bright", className)}>
      {initials}
    </span>
  );
}
