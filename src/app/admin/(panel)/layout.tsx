import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { countOrdersByView } from "@/server/orders";
import { ToastProvider } from "@/components/ui/toast";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: { default: "ניהול", template: "%s · ניהול גישמאק" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const counts = await countOrdersByView();
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-paper print:bg-white">
        <AdminNav newCount={counts.new ?? 0} adminName={admin.name} />
        <main className="pb-24 md:ps-60 md:pb-10 print:p-0">
          <div className="mx-auto w-full max-w-6xl px-4 pt-5 md:px-8 md:pt-8 print:max-w-none print:px-0 print:pt-0">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
