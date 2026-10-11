"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Sticky, horizontally scrollable category bar with scroll-spy. */
export function CategoryNav({ categories }: { categories: { slug: string; name: string; count: number }[] }) {
  const [active, setActive] = useState(categories[0]?.slug);
  const barRef = useRef<HTMLDivElement>(null);
  const clickLock = useRef(0);

  useEffect(() => {
    const sections = categories.map((c) => document.getElementById(c.slug)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        if (Date.now() < clickLock.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-130px 0px -60% 0px" },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [categories]);

  // keep the active chip in view inside the scroller
  useEffect(() => {
    const el = barRef.current?.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label="קטגוריות בתפריט" className="sticky top-16 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div ref={barRef} className="scrollbar-none mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5">
        {categories.map((c) => (
          <a
            key={c.slug}
            href={`#${c.slug}`}
            data-slug={c.slug}
            aria-current={active === c.slug ? "true" : undefined}
            onClick={() => {
              setActive(c.slug);
              clickLock.current = Date.now() + 900;
            }}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[15px] font-bold transition-colors",
              active === c.slug ? "border-night bg-night text-on-night" : "border-line bg-surface text-ink hover:border-ink-3",
            )}
          >
            {c.name}
            <span className={cn("num text-[12px] font-semibold", active === c.slug ? "text-gold-bright" : "text-ink-3")}>{c.count}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
