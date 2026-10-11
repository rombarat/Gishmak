import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-black text-gold">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold">הדף לא נמצא</h1>
      <p className="mt-2 text-ink-2">אולי הקישור השתנה. התפריט מחכה לכם.</p>
      <Link href="/menu" className={buttonClass("dark", "lg", "mt-6")}>
        לתפריט
      </Link>
    </div>
  );
}
