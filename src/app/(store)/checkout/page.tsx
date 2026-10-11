import type { Metadata } from "next";
import { getPickupOptions } from "@/server/pickup";
import { getSettings } from "@/server/settings";
import { todayIL } from "@/lib/time";
import { CheckoutForm } from "@/components/store/checkout-form";

export const metadata: Metadata = { title: "השלמת הזמנה", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [days, settings] = await Promise.all([getPickupOptions(), getSettings()]);
  return <CheckoutForm days={days} today={todayIL()} closedMessage={settings.isOrderingOpen ? null : settings.closedMessage} />;
}
