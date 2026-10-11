import type { Metadata } from "next";
import { getPickupAdminData } from "@/server/admin-catalog";
import { todayIL } from "@/lib/time";
import { PageHeader, SectionTitle } from "@/components/admin/page-header";
import { PickupWindows } from "@/components/admin/pickup-windows";
import { PickupBlocks } from "@/components/admin/pickup-blocks";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "זמני איסוף והגדרות" };
export const dynamic = "force-dynamic";

export default async function PickupPage() {
  const { windows, blocks, settings } = await getPickupAdminData();
  const windowRows = windows.map((w) => ({ id: w.id, weekday: w.weekday, startTime: w.startTime, endTime: w.endTime, capacity: w.capacity, isActive: w.isActive }));

  return (
    <>
      <PageHeader title="זמני איסוף והגדרות" subtitle="מתי אפשר לאסוף, אילו תאריכים חסומים, ופרטי החנות שמוצגים ללקוחות." />

      <div className="flex flex-col gap-10">
        <section aria-labelledby="windows">
          <SectionTitle id="windows">חלונות איסוף שבועיים</SectionTitle>
          <p className="mb-3 max-w-2xl text-[15px] text-ink-2">
            החלונות חוזרים כל שבוע. &quot;מקסימום הזמנות לחלון&quot; נספר <strong>לכל תאריך בנפרד</strong> — למשל 30 בחמישי הזה ועוד 30 בחמישי הבא. כשהחלון מתמלא הוא
            מסומן ללקוחות כמלא. השארת השדה ריק = ללא הגבלה.
          </p>
          <PickupWindows windows={windowRows} />
        </section>

        <section aria-labelledby="blocks-title" id="blocks" className="scroll-mt-20">
          <SectionTitle id="blocks-title">חסימת תאריכים</SectionTitle>
          <p className="mb-3 max-w-2xl text-[15px] text-ink-2">חג, חופשה או יום עמוס? חסמו יום שלם או חלון מסוים. הזמנות שכבר התקבלו לא מתבטלות.</p>
          <PickupBlocks
            blocks={blocks.map((b) => ({ id: b.id, date: b.date, reason: b.reason, window: b.window ? { startTime: b.window.startTime, endTime: b.window.endTime } : null }))}
            windows={windowRows}
            today={todayIL()}
          />
        </section>

        <section aria-labelledby="settings">
          <SectionTitle id="settings">הגדרות החנות</SectionTitle>
          <SettingsForm
            initial={{
              isOrderingOpen: settings.isOrderingOpen,
              closedMessage: settings.closedMessage,
              minLeadHours: settings.minLeadHours,
              maxDaysAhead: settings.maxDaysAhead,
              phone: settings.phone,
              whatsapp: settings.whatsapp,
              address: settings.address,
              hoursText: settings.hoursText,
            }}
          />
        </section>
      </div>
    </>
  );
}
