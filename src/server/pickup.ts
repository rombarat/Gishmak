import "server-only";
import { db } from "@/lib/db";
import { addDays, israelNow, minutesBetween, weekdayOf } from "@/lib/time";
import { getSettings } from "./settings";

export type PickupWindowOption = {
  id: string;
  start: string;
  end: string;
  available: boolean;
  reason?: "full" | "blocked" | "too-soon";
};
export type PickupDayOption = { date: string; windows: PickupWindowOption[] };

/** Days (Israel-local) with their pickup windows, honouring lead time, blocks and capacity. */
export async function getPickupOptions(now: Date = new Date()): Promise<PickupDayOption[]> {
  const settings = await getSettings();
  const il = israelNow(now);
  const lastDate = addDays(il.date, settings.maxDaysAhead);

  const [windows, blocks, counts] = await Promise.all([
    db.pickupWindow.findMany({ where: { isActive: true }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
    db.pickupBlock.findMany({ where: { date: { gte: il.date, lte: lastDate } } }),
    db.order.groupBy({
      by: ["pickupDate", "pickupWindowId"],
      where: { pickupDate: { gte: il.date, lte: lastDate }, status: { not: "CANCELLED" } },
      _count: { _all: true },
    }),
  ]);

  const days: PickupDayOption[] = [];
  for (let i = 0; i <= settings.maxDaysAhead; i++) {
    const date = addDays(il.date, i);
    if (blocks.some((b) => b.date === date && !b.windowId)) continue;
    const wd = weekdayOf(date);
    const opts: PickupWindowOption[] = windows
      .filter((w) => w.weekday === wd)
      .map((w) => {
        const lead = minutesBetween(il.date, il.time, date, w.startTime);
        if (lead < settings.minLeadHours * 60) return { id: w.id, start: w.startTime, end: w.endTime, available: false, reason: "too-soon" as const };
        if (blocks.some((b) => b.date === date && b.windowId === w.id))
          return { id: w.id, start: w.startTime, end: w.endTime, available: false, reason: "blocked" as const };
        const taken = counts.find((c) => c.pickupDate === date && c.pickupWindowId === w.id)?._count._all ?? 0;
        if (w.capacity != null && taken >= w.capacity)
          return { id: w.id, start: w.startTime, end: w.endTime, available: false, reason: "full" as const };
        return { id: w.id, start: w.startTime, end: w.endTime, available: true };
      })
      .filter((o) => o.reason !== "too-soon" && o.reason !== "blocked");
    if (opts.length) days.push({ date, windows: opts });
  }
  return days;
}

export async function validatePickup(date: string, windowId: string) {
  const days = await getPickupOptions();
  const day = days.find((d) => d.date === date);
  const win = day?.windows.find((w) => w.id === windowId);
  if (!day || !win) return { ok: false as const, error: "מועד האיסוף שבחרתם כבר לא זמין. נא לבחור מועד אחר." };
  if (!win.available) return { ok: false as const, error: "חלון האיסוף שבחרתם התמלא. נא לבחור שעה אחרת." };
  return { ok: true as const, window: win };
}
