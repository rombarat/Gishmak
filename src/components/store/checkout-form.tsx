"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CircleAlert, ChevronDown, ShoppingBag } from "lucide-react";
import type { PickupDayOption } from "@/server/pickup";
import { checkoutSchema } from "@/domain/checkout";
import { submitOrder } from "@/app/(store)/checkout/actions";
import { formatPrice } from "@/lib/money";
import { formatDayLong, formatWindow, relativeDay, WEEKDAY_HE, weekdayOf } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Button, buttonClass } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { QuantityStepper } from "@/components/ui/stepper";
import { useToast } from "@/components/ui/toast";
import { useCart } from "./cart-context";

type Errors = Partial<Record<string, string>>;
const CUSTOMER_KEY = "gishmak-customer-v1";

export function CheckoutForm({ days, today, closedMessage }: { days: PickupDayOption[]; today: string; closedMessage: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const { lines, unavailable, subtotalAgorot, count, setQuantity, remove, clear, hydrated } = useCart();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showRecipient, setShowRecipient] = useState(false);
  const [notes, setNotes] = useState("");
  const firstAvailableDay = days.find((d) => d.windows.some((w) => w.available))?.date ?? "";
  const [date, setDate] = useState(firstAvailableDay);
  const [windowId, setWindowId] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<{ message: string; items?: string[] } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const submitted = useRef(false);

  // returning customers: prefill name/phone
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? "null");
      if (saved?.name) setName(saved.name);
      if (saved?.phone) setPhone(saved.phone);
    } catch {
      /* ignore */
    }
  }, []);

  const day = days.find((d) => d.date === date);
  const selectedWindow = day?.windows.find((w) => w.id === windowId);

  const clearError = (key: string) => errors[key] && setErrors((e) => ({ ...e, [key]: undefined }));

  function scrollToFirstError(errs: Errors) {
    const order = ["customerName", "customerPhone", "pickupDate", "pickupWindowId", "notes", "confirmDetails"];
    const first = order.find((k) => errs[k]);
    if (first) document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    const input = {
      customerName: name,
      customerPhone: phone,
      recipientName: showRecipient ? recipient : "",
      notes,
      pickupDate: date,
      pickupWindowId: windowId,
      confirmDetails: confirm as true,
      lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
    };
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] ??= issue.message;
      setErrors(errs);
      scrollToFirstError(errs);
      toast("חסרים כמה פרטים — סימנו אותם בטופס", { tone: "error" });
      return;
    }
    setErrors({});
    startTransition(async () => {
      const res = await submitOrder(input);
      if (res.ok) {
        submitted.current = true;
        try {
          localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: name.trim(), phone: phone.trim() }));
        } catch {
          /* ignore */
        }
        clear();
        router.replace(`/order/${res.publicToken}?new=1`);
        return;
      }
      if (res.fieldErrors) {
        setErrors(res.fieldErrors);
        scrollToFirstError(res.fieldErrors);
      }
      setFormError({ message: res.error, items: res.unavailable });
      // refresh outside the transition so the button leaves its pending state immediately
      if (res.unavailable?.length || res.fieldErrors?.pickupWindowId) setTimeout(() => router.refresh(), 0);
      requestAnimationFrame(() => errorRef.current?.focus());
      toast(res.error, { tone: "error" });
    });
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-2" />
        <div className="mt-6 h-64 animate-pulse rounded-[6px] bg-surface-2" />
      </div>
    );
  }

  if (lines.length === 0 && unavailable.length === 0 && !submitted.current) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <ShoppingBag className="size-12 text-gold" aria-hidden />
        <h1 className="mt-4 font-display text-3xl font-bold">הסל ריק</h1>
        <p className="mt-2 text-ink-2">כדי להזמין, בחרו קודם מנות מהתפריט.</p>
        <Link href="/menu" className={buttonClass("dark", "lg", "mt-6")}>
          לתפריט
        </Link>
      </div>
    );
  }

  const summary = (
    <div className="rounded-[6px] border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-display text-xl font-bold">סיכום ההזמנה</h2>
        <span className="num text-sm text-ink-2">{count} פריטים</span>
      </div>
      <ul className="max-h-[46vh] divide-y divide-line overflow-y-auto px-4">
        {lines.map((l) => (
          <li key={l.variantId} className="flex items-center gap-3 py-3">
            {l.imageUrl ? (
              <Image src={l.imageUrl} alt="" width={48} height={48} className="size-12 shrink-0 rounded-[4px] object-cover" />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-[4px] bg-surface-2 font-display text-lg font-bold text-gold-ink" aria-hidden>
                {l.productName.slice(0, 1)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold">{l.productName}</p>
              <p className="text-[13px] text-ink-2">
                {l.variantLabel} · <span className="num">{formatPrice(l.priceAgorot)}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <QuantityStepper size="sm" value={l.quantity} onChange={(q) => setQuantity(l.variantId, q)} label={l.productName} />
              <span className="num text-[14px] font-extrabold">{formatPrice(l.lineTotalAgorot)}</span>
            </div>
          </li>
        ))}
        {unavailable.map((l) => (
          <li key={l.variantId} className="flex items-center gap-3 py-3">
            <div className="flex-1">
              <p className="text-[15px] font-bold text-ink-2 line-through">{l.productName}</p>
              <p className="text-[13px] font-semibold text-tomato">לא זמין כרגע — יש להסיר</p>
            </div>
            <button type="button" onClick={() => remove(l.variantId)} className={buttonClass("outline", "sm")}>
              הסרה
            </button>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 border-t border-line px-4 py-3 text-[15px]">
        <div className="flex justify-between text-ink-2">
          <dt>סכום ביניים</dt>
          <dd className="num">{formatPrice(subtotalAgorot)}</dd>
        </div>
        <div className="flex justify-between text-ink-2">
          <dt>איסוף עצמי</dt>
          <dd>ללא עלות</dd>
        </div>
        <div className="flex justify-between pt-1 text-lg font-extrabold">
          <dt>סה״כ</dt>
          <dd className="num">{formatPrice(subtotalAgorot)}</dd>
        </div>
      </dl>
      <div className="space-y-1.5 border-t border-dashed border-line bg-paper/60 px-4 py-3 text-[14px]">
        <p>
          <span className="text-ink-2">איסוף: </span>
          {day && selectedWindow ? (
            <strong>
              {formatDayLong(day.date)}, <span className="num">{formatWindow(selectedWindow.start, selectedWindow.end)}</span>
            </strong>
          ) : (
            <span className="font-semibold text-amber">טרם נבחר מועד</span>
          )}
        </p>
        <p>
          <span className="text-ink-2">על שם: </span>
          {name.trim() ? <strong>{name.trim()}</strong> : <span className="text-ink-3">—</span>}
          {phone.trim() && (
            <>
              <span className="text-ink-3"> · </span>
              <span className="ltr text-ink-2">{phone.trim()}</span>
            </>
          )}
        </p>
        <p className="text-ink-2">תשלום: בחנות, בזמן האיסוף</p>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-6xl px-4 pt-6 pb-32 md:pt-10 md:pb-16">
      <h1 className="font-display text-3xl font-black sm:text-4xl">השלמת הזמנה</h1>
      <p className="mt-1 text-ink-2">שלושה פרטים קצרים, ואנחנו מתחילים להכין.</p>

      {closedMessage && (
        <div className="mt-5 rounded-[6px] border border-amber/40 bg-amber-soft px-4 py-3 font-semibold text-amber">{closedMessage}</div>
      )}

      {formError && (
        <div ref={errorRef} tabIndex={-1} role="alert" className="mt-5 flex gap-3 rounded-[6px] border border-tomato/40 bg-tomato-soft px-4 py-3 text-tomato outline-none">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-bold">{formError.message}</p>
            {formError.items && formError.items.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-[15px]">
                {formError.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
            {unavailable.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  unavailable.forEach((l) => remove(l.variantId));
                  setFormError(null);
                }}
                className={buttonClass("outline", "sm", "mt-3 border-tomato/40 text-tomato")}
              >
                להסיר מהסל את מה שאזל
              </button>
            )}
          </div>
        </div>
      )}

      {/* mobile: collapsible order summary */}
      <div className="mt-5 md:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          className="flex min-h-12 w-full items-center gap-2 rounded-[6px] border border-line bg-surface px-4 font-bold"
        >
          <ShoppingBag className="size-5 text-gold-ink" aria-hidden />
          ההזמנה שלך · <span className="num">{count}</span> פריטים
          <span className="num ms-auto">{formatPrice(subtotalAgorot)}</span>
          <ChevronDown className={cn("size-5 transition-transform", summaryOpen && "rotate-180")} aria-hidden />
        </button>
        {summaryOpen && <div className="mt-2">{summary}</div>}
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_380px] md:items-start">
        <div className="space-y-8">
          {/* 1. details */}
          <fieldset className="space-y-4">
            <legend className="mb-3 flex items-center gap-2.5 font-display text-2xl font-bold">
              <StepNum n={1} /> הפרטים שלכם
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div id="f-customerName">
                <TextField
                  label="שם מלא"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError("customerName");
                  }}
                  error={errors.customerName}
                  maxLength={80}
                />
              </div>
              <div id="f-customerPhone">
                <TextField
                  label="טלפון נייד"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  className="text-end"
                  placeholder="050-1234567"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearError("customerPhone");
                  }}
                  error={errors.customerPhone}
                  hint="נתקשר רק אם יש שאלה לגבי ההזמנה"
                />
              </div>
            </div>
            {!showRecipient ? (
              <button type="button" onClick={() => setShowRecipient(true)} className="text-[15px] font-semibold text-gold-ink underline underline-offset-4">
                מישהו אחר יאסוף את ההזמנה?
              </button>
            ) : (
              <TextField
                label="שם מי שיאסוף"
                optional
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                maxLength={80}
                hint="נרשום את השם על השקית"
              />
            )}
          </fieldset>

          {/* 2. pickup */}
          <fieldset className="space-y-4">
            <legend className="mb-3 flex items-center gap-2.5 font-display text-2xl font-bold">
              <StepNum n={2} /> מתי לאסוף?
            </legend>
            {days.length === 0 ? (
              <p className="rounded-[6px] border border-dashed border-line bg-surface px-4 py-5 text-ink-2">
                אין כרגע מועדי איסוף פנויים להזמנה באתר. אפשר להתקשר אלינו ונמצא פתרון.
              </p>
            ) : (
              <>
                <div id="f-pickupDate" role="radiogroup" aria-label="יום איסוף" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {days.map((d) => {
                    const anyFree = d.windows.some((w) => w.available);
                    const active = d.date === date;
                    const [, m, dd] = d.date.split("-").map(Number);
                    return (
                      <button
                        key={d.date}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={!anyFree}
                        onClick={() => {
                          setDate(d.date);
                          setWindowId("");
                          clearError("pickupDate");
                        }}
                        className={cn(
                          "flex min-h-16 min-w-[92px] shrink-0 flex-col items-center justify-center rounded-[6px] border px-3 py-2 transition-colors disabled:opacity-45",
                          active ? "border-night bg-night text-on-night" : "border-line bg-surface hover:border-ink-3",
                        )}
                      >
                        <span className={cn("text-[13px] font-semibold", active ? "text-gold-bright" : "text-ink-2")}>
                          {relativeDay(d.date, today) === "היום" || relativeDay(d.date, today) === "מחר" ? relativeDay(d.date, today) : `יום ${WEEKDAY_HE[weekdayOf(d.date)]}`}
                        </span>
                        <span className="num text-[18px] font-extrabold">
                          {dd}.{m}
                        </span>
                        {!anyFree && <span className="text-[11px]">מלא</span>}
                      </button>
                    );
                  })}
                </div>
                {day && (
                  <div id="f-pickupWindowId">
                    <p className="mb-2 text-[15px] font-bold">
                      שעת איסוף ב{formatDayLong(day.date)}
                    </p>
                    <div role="radiogroup" aria-label="חלון איסוף" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {day.windows.map((w) => {
                        const active = w.id === windowId;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={!w.available}
                            onClick={() => {
                              setWindowId(w.id);
                              clearError("pickupWindowId");
                            }}
                            className={cn(
                              "flex min-h-14 flex-col items-center justify-center rounded-[6px] border px-3 transition-colors disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3",
                              active ? "border-gold bg-gold-soft ring-2 ring-gold" : "border-line bg-surface hover:border-ink-3",
                            )}
                          >
                            <span className="num text-[17px] font-extrabold">{formatWindow(w.start, w.end)}</span>
                            {!w.available && <span className="text-[12px] font-semibold">החלון מלא</span>}
                          </button>
                        );
                      })}
                    </div>
                    {errors.pickupWindowId && <p className="mt-2 text-sm font-semibold text-tomato">{errors.pickupWindowId}</p>}
                  </div>
                )}
                {errors.pickupDate && <p className="text-sm font-semibold text-tomato">{errors.pickupDate}</p>}
              </>
            )}
          </fieldset>

          {/* 3. notes */}
          <fieldset className="space-y-4">
            <legend className="mb-3 flex items-center gap-2.5 font-display text-2xl font-bold">
              <StepNum n={3} /> הערות להזמנה
            </legend>
            <div id="f-notes">
              <TextAreaField
                label="משהו שחשוב שנדע?"
                optional
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  clearError("notes");
                }}
                maxLength={600}
                error={errors.notes}
                placeholder="לדוגמה: הערינג חריף, צ׳ולנט בלי ביצים, לארוז את החלות בנפרד"
              />
            </div>
          </fieldset>

          {/* confirm */}
          <div id="f-confirmDetails" className="rounded-[6px] border border-line bg-surface p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => {
                  setConfirm(e.target.checked);
                  clearError("confirmDetails");
                }}
                className="mt-1 size-5 shrink-0 accent-[#17130f]"
                aria-invalid={errors.confirmDetails ? true : undefined}
              />
              <span className="text-[15px] leading-relaxed">
                בדקתי את הפריטים ואת מועד האיסוף. ידוע לי שהתשלום מתבצע בחנות בזמן האיסוף.
              </span>
            </label>
            {errors.confirmDetails && <p className="mt-2 text-sm font-semibold text-tomato">{errors.confirmDetails}</p>}
          </div>

          <div className="hidden md:block">
            <Button type="submit" size="lg" loading={pending} disabled={!!closedMessage || lines.length === 0} className="w-full text-[17px]">
              {pending ? "שולחים את ההזמנה…" : `שליחת ההזמנה · ${formatPrice(subtotalAgorot)}`}
            </Button>
          </div>
        </div>

        <aside className="sticky top-24 hidden md:block" aria-label="סיכום ההזמנה">
          {summary}
        </aside>
      </div>

      {/* mobile sticky submit */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <Button type="submit" size="lg" loading={pending} disabled={!!closedMessage || lines.length === 0} className="w-full text-[17px]">
          {pending ? "שולחים…" : `שליחת ההזמנה · ${formatPrice(subtotalAgorot)}`}
        </Button>
      </div>
    </form>
  );
}

function StepNum({ n }: { n: number }) {
  return (
    <span className="num grid size-8 shrink-0 place-items-center rounded-full border-2 border-gold font-sans text-base font-extrabold text-gold-ink" aria-hidden>
      {n}
    </span>
  );
}
