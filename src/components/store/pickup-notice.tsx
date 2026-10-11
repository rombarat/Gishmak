import { CalendarClock, MapPin } from "lucide-react";
import type { PickupDayOption } from "@/server/pickup";
import { formatDayLong, formatWindow } from "@/lib/time";
import { cn } from "@/lib/utils";

/** "Next pickup" strip — tells the customer when they can collect before they start choosing. */
export function PickupNotice({
  days,
  address,
  isOpen,
  closedMessage,
  tone = "light",
  rowFrom = "sm",
}: {
  days: PickupDayOption[];
  address: string;
  isOpen: boolean;
  closedMessage: string;
  tone?: "light" | "dark";
  /** breakpoint where the two facts sit side by side */
  rowFrom?: "sm" | "xl";
}) {
  const first = days.find((d) => d.windows.some((w) => w.available));
  const firstWindow = first?.windows.find((w) => w.available);
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[6px] border px-4 py-3 text-[15px]",
        rowFrom === "sm" ? "sm:flex-row sm:items-center sm:gap-6" : "xl:flex-row xl:items-center xl:gap-6",
        dark ? "border-night-3 bg-night-2 text-on-night" : "border-line bg-surface",
      )}
    >
      <p className="flex items-center gap-2">
        <CalendarClock className={cn("size-5 shrink-0", dark ? "text-gold-bright" : "text-gold-ink")} aria-hidden />
        {!isOpen ? (
          <span className="font-semibold">{closedMessage}</span>
        ) : first && firstWindow ? (
          <span>
            האיסוף הקרוב: <strong className="font-bold">{formatDayLong(first.date)}</strong>,{" "}
            <span className="num">{formatWindow(firstWindow.start, firstWindow.end)}</span>
          </span>
        ) : (
          <span className="font-semibold">אין כרגע מועדי איסוף פנויים. נשמח אם תתקשרו אלינו.</span>
        )}
      </p>
      <p className="flex items-center gap-2">
        <MapPin className={cn("size-5 shrink-0", dark ? "text-gold-bright" : "text-gold-ink")} aria-hidden />
        <span>
          איסוף עצמי · <span className={dark ? "text-on-night-2" : "text-ink-2"}>{address}</span>
        </span>
      </p>
    </div>
  );
}
