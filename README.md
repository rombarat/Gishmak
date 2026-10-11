# גישמאק — חנות הזמנות לשבת + מערכת ניהול

חנות הזמנה מראש עם איסוף עצמי לגישמאק (אוכל מוכן לשבת, קריית יערים), ומערכת Admin לבעלי העסק.
Hebrew-first, RTL מלא, mobile-first.

## פריסה ל-Vercel

1. **Add New → Project** → לייבא את `rombarat/Gishmak` (Framework: Next.js, Root Directory: `./`).
2. **Environment Variables** — להוסיף לפני הלחיצה על Deploy:
   - `SESSION_SECRET` — מחרוזת אקראית של 32+ תווים (למשל מ-https://generate-secret.vercel.app/32)
   - `ADMIN_EMAIL` — האימייל של בעל העסק לכניסה לניהול
   - `ADMIN_PASSWORD` — סיסמה לכניסה לניהול
   - `SEED_SAMPLE_ORDERS` = `true` — רק אם רוצים 10 הזמנות לדוגמה בפריסה הראשונה (לא חובה)
3. **Deploy**. הפריסה הראשונה תיכשל עם הודעה `DATABASE_URL is not set` — זה צפוי.
4. בפרויקט: **Storage → Create Database → Neon** (Postgres, חינם) → Connect לפרויקט. Vercel מוסיף את `DATABASE_URL` לבד.
5. (מומלץ) **Storage → Create → Blob** → Connect — מאפשר העלאת תמונות מוצרים מה-Admin.
6. **Deployments → ⋯ → Redeploy**.

בכל פריסה (`vercel-build`): `prisma generate` → הרצת migrations → seed שלא מוחק ולא משנה נתונים קיימים (יוצר רק מה שחסר: קטגוריות, מוצרים, חלונות איסוף, משתמש הבעלים) → `next build`.

- חנות: `/` · תפריט: `/menu` · השלמת הזמנה: `/checkout` · אישור הזמנה: `/order/<token>`
- ניהול: `/admin` — נכנסים עם `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- שינוי `ADMIN_PASSWORD` אחרי הפריסה הראשונה לא משנה את הסיסמה הקיימת (המשתמש כבר נוצר).

## Stack

Next.js 15 (App Router, Server Components, Server Actions) · TypeScript · Tailwind CSS v4 · Prisma 6 · PostgreSQL (Neon) · Vercel Blob · zod · jose (session JWT) · bcryptjs.

## מבנה

```
prisma/            schema.prisma (מודל נתונים), seed.ts
src/domain/        כללי עסק טהורים: סטטוסים, סכמת checkout (משותפת לקליינט ולשרת)
src/lib/           db, auth/session, money (אגורות → ₪), time (Asia/Jerusalem), utils
src/server/        לוגיקה עסקית בצד שרת: catalog, pickup (זמינות חלונות), orders, admin-catalog, settings
src/app/(store)/   החנות: דף בית, תפריט, checkout, אישור הזמנה
src/app/admin/     מערכת הניהול (מוגנת ב-middleware + requireAdmin בכל עמוד ופעולה)
src/components/    ui/ (רכיבים משותפים) · store/ · admin/
```

UI לא מכיל לוגיקה עסקית: הוא קורא לפונקציות ב-`src/server`, שהן המקום היחיד שנוגע במסד הנתונים.

## מודל נתונים (תקציר)

`Category` 1—N `Product` 1—N `ProductVariant` (גדלים/מחירים, במחיר באגורות) ·
`Order` 1—N `OrderItem` (snapshot של שם/גודל/מחיר — היסטוריה לא נשברת כשמוצר משתנה) ·
`Order` 1—N `OrderEvent` (timeline: יצירה, שינויי סטטוס, עריכות, הערות פנימיות, מי ביצע) ·
`Order` 1—N `Payment` (מוכן לסליקה) · `PickupWindow` (חלונות שבועיים, `capacity` אופציונלי) ·
`PickupBlock` (חסימת יום או חלון בתאריך) · `StoreSettings` · `AdminUser`.

מוצר שנמכר בעבר לא נמחק — הוא מועבר לארכיון. "אזל להיום" נשמר כתאריך (`soldOutDate`) ומתבטל לבד למחרת.

## תהליך הזמנה

1. הסל נשמר ב-localStorage ומתעדכן מול הקטלוג החי (מחיר עדכני, פריט שאזל מסומן).
2. `placeOrder` (שרת) מאמת את הטופס עם אותה סכמת zod, **מתמחר מחדש מהמסד** (מחירי הקליינט לא נאמנים), בודק זמינות מוצרים, זמן הכנה מינימלי, חסימות ומגבלת הזמנות לחלון, ויוצר בטרנזקציה: מספר הזמנה רץ, Order, OrderItems, OrderEvent.
3. הלקוח מקבל קישור אישור עם token לא ניחוש, שמציג גם את הסטטוס העדכני.

## הוספת סליקה בעתיד

השדות כבר קיימים: `Order.paymentMethod`, `Order.paymentStatus`, וטבלת `Payment` (`provider`, `providerTransactionId`, `amountAgorot`, `refundedAgorot`, `status`, `rawPayload`).
להוספת ספק (Cardcom / Tranzila / Stripe וכו'):
1. ב-`placeOrder` — ליצור את ההזמנה עם `paymentMethod: "ONLINE"`, `paymentStatus: "PENDING"` ושורת `Payment` ב-PENDING, ולהחזיר URL לתשלום.
2. Route handler ל-webhook של הספק → עדכון `Payment.status` ו-`Order.paymentStatus` + `OrderEvent` מסוג `PAYMENT`.
3. החזרים: עדכון `refundedAgorot` ו-`paymentStatus: "PARTIALLY_REFUNDED" | "REFUNDED"`.
אין צורך לשנות את טופס ההזמנה, את ה-OrderItems או את מסכי הניהול מעבר להצגת הסטטוס.

## תמונות

תמונות `real-*` צולמו בחנות (פורסמו ע"י העסק ב-easy.co.il — מומלץ לוודא הרשאת שימוש). תמונות `ill-*` מ-Wikimedia Commons ברישיון CC ומסומנות באתר "להמחשה". מוצר בלי תמונה מוצג כשורה בתפריט ולא עם placeholder. מקור מלא: `SOURCES.md`.
העלאת תמונות מה-Admin נשמרת ב-Vercel Blob (כשמחובר לפרויקט), ראו `saveUploadedImage` ב-`src/server/admin-catalog.ts`.

## מה לעדכן לפני עלייה לאוויר

- מחירים, גדלים ותיאורים (ערכי התחלה), חלונות איסוף וזמן הכנה מינימלי — הכל מה-Admin.
- `SESSION_SECRET`, סיסמת הבעלים.
- כשרות — לא הוצגה באתר כי דורשת אימות עדכני.
