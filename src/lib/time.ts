/**
 * All business dates are Israel-local. Dates are passed around as "YYYY-MM-DD"
 * strings and times as "HH:mm" so server timezone never matters.
 */
export const TZ = "Asia/Jerusalem";

const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function israelNow(at: Date = new Date()) {
  const p = Object.fromEntries(partsFmt.formatToParts(at).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
    weekday: WEEKDAYS_EN.indexOf(p.weekday as string),
  };
}

export function todayIL(): string {
  return israelNow().date;
}

export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function weekdayOf(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Minutes between two Israel-local date+time pairs (b - a). */
export function minutesBetween(aDate: string, aTime: string, bDate: string, bTime: string): number {
  const toMin = (date: string, time: string) => {
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    return Date.UTC(y, m - 1, d, hh, mm) / 60000;
  };
  return toMin(bDate, bTime) - toMin(aDate, aTime);
}

export const WEEKDAY_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

/** "יום שישי, 16.10" */
export function formatDayLong(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  return `יום ${WEEKDAY_HE[weekdayOf(ymd)]}, ${d}.${m}`;
}

/** "שישי 16.10" */
export function formatDayShort(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  return `${WEEKDAY_HE[weekdayOf(ymd)]} ${d}.${m}`;
}

/** Relative label: "היום" / "מחר" / weekday. */
export function relativeDay(ymd: string, today = todayIL()): string {
  if (ymd === today) return "היום";
  if (ymd === addDays(today, 1)) return "מחר";
  return formatDayShort(ymd);
}

const dateTimeFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TZ,
  day: "numeric",
  month: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const timeFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatDateTime(d: Date | string): string {
  return dateTimeFmt.format(typeof d === "string" ? new Date(d) : d);
}
export function formatTime(d: Date | string): string {
  return timeFmt.format(typeof d === "string" ? new Date(d) : d);
}

const LRI = String.fromCharCode(0x2066); // left-to-right isolate
const PDI = String.fromCharCode(0x2069); // pop directional isolate

/** "19:00–21:00", isolated as LTR (U+2066…U+2069) so the range never flips inside Hebrew text. */
export function formatWindow(start: string, end: string): string {
  return LRI + start + "–" + end + PDI;
}

/** Israel-local date of a timestamp. */
export function ilDateOf(d: Date): string {
  return israelNow(d).date;
}

/** Isolates every "HH:MM–HH:MM" range inside free text (e.g. opening hours) so it reads LTR. */
export function isolateTimeRanges(text: string): string {
  return text.replace(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/g, (_, a, b) => formatWindow(a, b));
}
