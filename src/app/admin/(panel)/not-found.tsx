import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

export default function AdminNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="לא מצאנו את מה שחיפשתם"
      body="ייתכן שההזמנה או המוצר נמחקו, או שהקישור שגוי."
      action={
        <Link href="/admin" className={buttonClass("dark")}>
          חזרה ללוח הבקרה
        </Link>
      }
      className="mt-8"
    />
  );
}
