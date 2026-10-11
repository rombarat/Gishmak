"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarClock,
  ChefHat,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  Tags,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; short: string; icon: typeof LayoutDashboard; badge?: boolean };

const NAV: NavItem[] = [
  { href: "/admin", label: "לוח בקרה", short: "לוח", icon: LayoutDashboard },
  { href: "/admin/orders", label: "הזמנות", short: "הזמנות", icon: ClipboardList, badge: true },
  { href: "/admin/kitchen", label: "מטבח (רשימת הכנה)", short: "מטבח", icon: ChefHat },
  { href: "/admin/products", label: "מוצרים", short: "מוצרים", icon: Package },
  { href: "/admin/categories", label: "קטגוריות", short: "קטגוריות", icon: Tags },
  { href: "/admin/pickup", label: "זמני איסוף והגדרות", short: "איסוף", icon: CalendarClock },
];
const TABS = NAV.slice(0, 4);
const MORE = NAV.slice(4);

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function Badge({ count, className }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn("num inline-grid min-w-5 place-items-center rounded-full bg-gold-bright px-1.5 text-[12px] font-extrabold leading-5 text-night", className)}
      aria-label={`${count} הזמנות חדשות`}
    >
      {count}
    </span>
  );
}

function LogoutButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

export function AdminNav({ newCount, adminName }: { newCount: number; adminName: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);
  const moreActive = MORE.some((i) => isActive(pathname, i.href));
  const current = NAV.find((i) => isActive(pathname, i.href));

  return (
    <>
      {/* ---------- desktop sidebar (the shop sign) ---------- */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-60 flex-col bg-night text-on-night md:flex print:hidden">
        <Link href="/admin" className="flex flex-col items-center gap-1 border-b border-gold/25 px-5 pb-4 pt-5">
          <Image src="/images/logo-mark.png" alt="גישמאק" width={520} height={213} className="h-auto w-36" priority />
          <span className="text-[12px] font-bold tracking-wide text-on-night-2">ניהול החנות</span>
        </Link>
        <nav aria-label="ניווט ניהול" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-[6px] border-s-[3px] px-3 text-[15px] font-semibold transition-colors",
                      active
                        ? "border-gold-bright bg-night-2 text-gold-bright"
                        : "border-transparent text-on-night-2 hover:bg-night-2 hover:text-on-night",
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && <Badge count={newCount} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex flex-col gap-1 border-t border-gold/25 px-3 py-3">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="flex min-h-11 items-center gap-3 rounded-[6px] px-3 text-[15px] font-semibold text-on-night-2 hover:bg-night-2 hover:text-on-night"
          >
            <ExternalLink className="size-[18px]" aria-hidden />
            לחנות
          </a>
          <LogoutButton className="flex min-h-11 w-full items-center gap-3 rounded-[6px] px-3 text-[15px] font-semibold text-on-night-2 hover:bg-night-2 hover:text-on-night">
            <LogOut className="size-[18px]" aria-hidden />
            <span className="flex-1 text-start">יציאה</span>
            <span className="truncate text-[12px] font-normal text-on-night-2/80">{adminName}</span>
          </LogoutButton>
        </div>
      </aside>

      {/* ---------- mobile top bar ---------- */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-night px-4 text-on-night md:hidden print:hidden">
        <Link href="/admin" aria-label="לוח בקרה">
          <Image src="/images/logo-mark.png" alt="גישמאק" width={520} height={213} className="h-auto w-[72px]" priority />
        </Link>
        <span className="truncate font-display text-lg font-bold text-gold-bright">{current?.label ?? "ניהול"}</span>
        <a href="/" target="_blank" rel="noopener" className="ms-auto inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-on-night-2">
          <ExternalLink className="size-4" aria-hidden />
          לחנות
        </a>
      </header>

      {/* ---------- mobile bottom tab bar ---------- */}
      <nav
        aria-label="ניווט ניהול"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-night pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
      >
        <ul className="grid grid-cols-5">
          {TABS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-[12px] font-bold",
                    active ? "text-gold-bright" : "text-on-night-2",
                  )}
                >
                  {active && <span className="absolute inset-x-4 top-0 h-[3px] rounded-b bg-gold-bright" aria-hidden />}
                  <span className="relative">
                    <Icon className="size-[22px]" aria-hidden />
                    {item.badge && <Badge count={newCount} className="absolute -top-2 start-3.5" />}
                  </span>
                  {item.short}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-controls="admin-more"
              className={cn(
                "relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[12px] font-bold",
                moreActive || moreOpen ? "text-gold-bright" : "text-on-night-2",
              )}
            >
              {moreActive && <span className="absolute inset-x-4 top-0 h-[3px] rounded-b bg-gold-bright" aria-hidden />}
              {moreOpen ? <X className="size-[22px]" aria-hidden /> : <MenuIcon className="size-[22px]" aria-hidden />}
              עוד
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-30 md:hidden print:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 animate-fade-in bg-night/50" aria-hidden />
          <div
            id="admin-more"
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-16 animate-sheet-up rounded-t-[12px] border-t border-gold/30 bg-night px-3 pb-3 pt-4 text-on-night"
          >
            <ul className="flex flex-col gap-1">
              {MORE.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-[6px] px-3 text-base font-semibold",
                        active ? "bg-night-2 text-gold-bright" : "text-on-night hover:bg-night-2",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li className="mt-1 border-t border-gold/20 pt-1">
                <LogoutButton className="flex min-h-12 w-full items-center gap-3 rounded-[6px] px-3 text-base font-semibold text-on-night-2 hover:bg-night-2">
                  <LogOut className="size-5" aria-hidden />
                  <span className="flex-1 text-start">יציאה</span>
                  <span className="text-sm font-normal">{adminName}</span>
                </LogoutButton>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
