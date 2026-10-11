"use client";

import { useState } from "react";
import { saveSettingsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Toggle } from "./toggle";
import { useAction } from "./use-action";

export type SettingsValue = {
  isOrderingOpen: boolean;
  closedMessage: string;
  minLeadHours: number;
  maxDaysAhead: number;
  phone: string;
  whatsapp: string;
  address: string;
  hoursText: string;
};

export function SettingsForm({ initial }: { initial: SettingsValue }) {
  const [v, setV] = useState({ ...initial, minLeadHours: String(initial.minLeadHours), maxDaysAhead: String(initial.maxDaysAhead) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pending, run } = useAction();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = Number(v.minLeadHours);
    const ahead = Number(v.maxDaysAhead);
    const errs: Record<string, string> = {};
    if (!Number.isInteger(lead) || lead < 0 || lead > 168) errs.minLeadHours = "מספר שעות שלם בין 0 ל-168";
    if (!Number.isInteger(ahead) || ahead < 1 || ahead > 60) errs.maxDaysAhead = "מספר ימים שלם בין 1 ל-60";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    run(() => saveSettingsAction({ ...v, minLeadHours: lead, maxDaysAhead: ahead }), "ההגדרות נשמרו");
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className={cn("rounded-[6px] border-2 p-4", v.isOrderingOpen ? "border-leaf/40 bg-leaf-soft/50" : "border-tomato/40 bg-tomato-soft/60")}>
        <Toggle
          checked={v.isOrderingOpen}
          onChange={(isOrderingOpen) => setV((s) => ({ ...s, isOrderingOpen }))}
          label={v.isOrderingOpen ? "ההזמנות באתר פתוחות" : "ההזמנות באתר סגורות"}
          description="השינוי נכנס לתוקף אחרי שמירה"
        />
        {!v.isOrderingOpen && (
          <TextField
            label="ההודעה שהלקוחות יראו"
            value={v.closedMessage}
            onChange={set("closedMessage")}
            maxLength={200}
            wrapperClassName="mt-3"
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="זמן הכנה מינימלי (שעות)"
          type="number"
          inputMode="numeric"
          min={0}
          max={168}
          value={v.minLeadHours}
          onChange={set("minLeadHours")}
          error={errors.minLeadHours}
          hint="כמה שעות לפחות בין ההזמנה לתחילת חלון האיסוף"
          className="num"
        />
        <TextField
          label="אפשר להזמין עד (ימים קדימה)"
          type="number"
          inputMode="numeric"
          min={1}
          max={60}
          value={v.maxDaysAhead}
          onChange={set("maxDaysAhead")}
          error={errors.maxDaysAhead}
          hint="כמה ימים מהיום מוצגים בבחירת מועד האיסוף"
          className="num"
        />
        <TextField label="טלפון החנות" type="tel" inputMode="tel" dir="ltr" value={v.phone} onChange={set("phone")} className="text-start" />
        <TextField label="וואטסאפ" type="tel" inputMode="tel" dir="ltr" value={v.whatsapp} onChange={set("whatsapp")} hint="מספר לקישור וואטסאפ באתר" className="text-start" />
        <TextField label="כתובת" value={v.address} onChange={set("address")} wrapperClassName="sm:col-span-2" />
        <TextAreaField label="שעות פתיחה" value={v.hoursText} onChange={set("hoursText")} wrapperClassName="sm:col-span-2" hint="כפי שיופיע באתר. שורה לכל יום." rows={4} />
      </div>
      <Button type="submit" size="lg" loading={pending} className="self-start">
        שמירת ההגדרות
      </Button>
    </form>
  );
}
