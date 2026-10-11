import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { Flourish } from "@/components/ui/ornament";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "כניסה לניהול", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const { next } = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center bg-night px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/images/logo.png" alt="גישמאק" width={736} height={302} priority className="h-auto w-56" />
          <div className="mt-4 flex items-center gap-3 text-gold">
            <Flourish />
            <span className="text-sm font-bold tracking-wide text-on-night-2">ניהול החנות</span>
            <Flourish className="-scale-x-100" />
          </div>
        </div>
        <div className="rounded-[6px] border border-gold/40 bg-surface p-6 shadow-pop">
          <h1 className="mb-1 font-display text-2xl font-bold text-ink">כניסה</h1>
          <p className="mb-5 text-[15px] text-ink-2">הזמנות, מטבח, תפריט וזמני איסוף.</p>
          <LoginForm next={next ?? ""} />
        </div>
      </div>
    </main>
  );
}
