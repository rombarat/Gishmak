/**
 * Seeds the catalog from the shop's printed menu (names are real; prices,
 * sizes and descriptions are starting values for the owner to edit),
 * pickup windows based on the published opening hours, an owner account
 * and a handful of sample orders so the admin is not empty on first run.
 *
 * Safe to run on every deploy (Vercel build runs it): it only creates what is
 * missing and never deletes or changes existing data.
 * Sample orders are created only when SEED_SAMPLE_ORDERS="true" and the
 * database has no orders yet.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();

type V = [label: string, shekels: number];
type P = {
  slug: string;
  name: string;
  description?: string;
  image?: string;
  illustration?: string; // credit, marks the image as illustrative
  featured?: boolean;
  variants: V[];
};

const SALAD: V[] = [["קופסה 250 גרם", 14], ["קופסה 500 גרם", 25]];
const SALAD_LIGHT: V[] = [["קופסה 250 גרם", 12], ["קופסה 500 גרם", 22]];
const SPICY: V[] = [["קופסה 150 גרם", 10], ["קופסה 250 גרם", 16]];
const TRAY: V[] = [["תבנית קטנה", 25], ["תבנית גדולה", 45]];

const CATALOG: { slug: string; name: string; description: string; products: P[] }[] = [
  {
    slug: "cholent-kugel",
    name: "חמין וקוגלים",
    description: "מה שעולה על הפלטה לסעודת שבת בבוקר.",
    products: [
      {
        slug: "cholent",
        name: "טשולנט הבית",
        description: "צ׳ולנט בשרי ביתי, מבושל לאט כל הלילה. בוחרים גודל לפי מספר הסועדים.",
        image: "/images/ill-cholent.jpg",
        illustration: "Newmila · CC BY-SA 4.0",
        featured: true,
        variants: [["קופסה ½ ליטר", 28], ["קופסה 1 ליטר", 52], ["קופסה 2 ליטר", 98]],
      },
      { slug: "kugel-yerushalmi", name: "קוגל ירושלמי", description: "אטריות דקות, קרמל ופלפל שחור — מתוק־חריף כמו שצריך.", image: "/images/ill-jerusalem-kugel.jpg", illustration: "Peteravivangel · CC BY-SA 4.0", featured: true, variants: TRAY },
      { slug: "kugel-potato", name: "קוגל תפוח אדמה", description: "שכבה עליונה פריכה, בפנים רך.", image: "/images/ill-potato-kugel.jpg", illustration: "Rebecca Siegel · CC BY 2.0", featured: true, variants: TRAY },
      { slug: "kugel-sweet", name: "קוגל מתוק", description: "קוגל אטריות מתוק לקינוח של סעודת שבת.", image: "/images/ill-sweet-kugel.jpg", illustration: "Off-shell · CC BY-SA 4.0", variants: TRAY },
      { slug: "kugel-apple", name: "קוגל תפוח עץ", description: "תפוחי עץ וקינמון.", variants: TRAY },
      { slug: "kugel-broccoli", name: "קוגל ברוקולי", description: "קוגל ירוק ורך.", variants: TRAY },
    ],
  },
  {
    slug: "salads",
    name: "סלטים ביתיים",
    description: "מתוך רשימת הסלטים של החנות. כל סלט בשני גדלים.",
    products: [
      { slug: "hummus", name: "חומוס", description: "חומוס ביתי עם גרגרים, פפריקה ושמן זית.", image: "/images/real-hummus.jpg", featured: true, variants: SALAD },
      { slug: "chopped-liver", name: "כבד קצוץ", description: "כבד עוף קצוץ עם בצל מטוגן, כמו של סבתא.", image: "/images/ill-chopped-liver.jpg", illustration: "Mushki Brichta · CC BY-SA 4.0", featured: true, variants: [["קופסה 250 גרם", 18], ["קופסה 500 גרם", 32]] },
      { slug: "matbucha", name: "מטבוחה", description: "עגבניות ופלפלים מבושלים לאט.", image: "/images/ill-matbucha.jpg", illustration: "Chubbychef · CC BY-SA 4.0", variants: SALAD },
      { slug: "tahini", name: "טחינה", variants: SALAD_LIGHT },
      { slug: "liver-in-sauce", name: "כבד ברוטב", variants: [["קופסה 250 גרם", 18], ["קופסה 500 גרם", 32]] },
      { slug: "italian-eggplant", name: "חציל איטלקי", variants: SALAD },
      { slug: "baba-ganoush", name: "באבא גנוש", variants: SALAD },
      { slug: "eggplant-liver", name: "חציל בטעם כבד", variants: SALAD },
      { slug: "hot-pepper", name: "פלפל חריף", variants: SALAD_LIGHT },
      { slug: "home-eggplant", name: "חציל הבית", variants: SALAD },
      { slug: "roasted-eggplant", name: "חציל קלוי חריף", variants: SALAD },
      { slug: "guacamole", name: "גוואקמולי", variants: [["קופסה 250 גרם", 18], ["קופסה 500 גרם", 32]] },
      { slug: "home-carrot", name: "גזר הבית", variants: SALAD_LIGHT },
      { slug: "beets", name: "סלק", variants: SALAD_LIGHT },
      { slug: "tirshi", name: "טירשי", variants: SALAD_LIGHT },
      { slug: "hazilata", name: "חצילטה", variants: SALAD },
      { slug: "coleslaw", name: "קולסלאו", variants: SALAD_LIGHT },
      { slug: "quinoa", name: "קינואה", variants: SALAD },
      { slug: "eggs", name: "סלט ביצים", variants: SALAD },
      { slug: "tabbouleh", name: "טבולה", variants: SALAD },
      { slug: "eggplant-chili", name: "חציל בצ׳ילי ובוטנים", variants: SALAD },
      { slug: "eggplant-marinade", name: "חציל בתחמיץ", variants: SALAD },
      { slug: "corn", name: "תירס", variants: SALAD_LIGHT },
      { slug: "tomato-dip", name: "דיפ עגבניות", variants: SALAD_LIGHT },
      { slug: "garlic-dip", name: "מטבל שום", variants: SALAD_LIGHT },
      { slug: "moroccan-olives", name: "זיתים מרוקאים", variants: SALAD },
      { slug: "harin", name: "חריין", variants: SALAD_LIGHT },
      { slug: "purple-cabbage", name: "כרוב סגול", variants: SALAD_LIGHT },
      { slug: "arbes", name: "ארבעס", variants: SALAD_LIGHT },
      { slug: "schug", name: "סחוג", variants: SPICY },
      { slug: "hilba", name: "חילבה", variants: SPICY },
    ],
  },
  {
    slug: "fish",
    name: "דגים והערינג",
    description: "לסעודת ליל שבת.",
    products: [
      { slug: "herring", name: "הערינג במבחר טעמים", description: "את הטעם המועדף (מתוק / חריף / בשמנת) אפשר לציין בהערות להזמנה.", featured: true, variants: [["קופסה 250 גרם", 22], ["קופסה 500 גרם", 40]] },
      { slug: "gefilte", name: "גפילטע פיש", description: "עם פרוסת גזר, כמו שצריך.", image: "/images/ill-gefilte.jpg", illustration: "Mushki Brichta · CC BY-SA 4.0", variants: [["פרוסה", 9], ["מגש 6 פרוסות", 50]] },
      { slug: "moshat", name: "מושט", variants: [["מנה", 35]] },
      { slug: "salmon", name: "סלומון", variants: [["מנה", 38]] },
    ],
  },
  {
    slug: "mains",
    name: "עיקריות",
    description: "עוף ובשר לסעודות שבת.",
    products: [
      { slug: "grill-chicken", name: "עוף בגריל", variants: [["מנה", 32], ["מגש 5 מנות", 150]] },
      { slug: "sweet-chicken", name: "עוף מתוק", variants: [["מנה", 32], ["מגש 5 מנות", 150]] },
      { slug: "schnitzel", name: "שניצל", variants: [["מנה", 30], ["מגש 5 מנות", 140]] },
      { slug: "pargit", name: "פרגית", variants: [["מנה", 36]] },
      { slug: "chicken-steak", name: "סטייק עוף", variants: [["מנה", 34]] },
    ],
  },
  {
    slug: "sides",
    name: "תוספות",
    description: "לצד העיקרית.",
    products: [
      { slug: "rice", name: "אורז", variants: [["500 גרם", 16], ["1 ק״ג", 30]] },
      { slug: "potatoes", name: "תפוחי אדמה", variants: [["500 גרם", 16], ["1 ק״ג", 30]] },
      { slug: "lecso", name: "לצ׳ו", variants: [["500 גרם", 18]] },
      { slug: "green-beans", name: "שעועית ירוקה", variants: [["500 גרם", 18]] },
      { slug: "pastels", name: "פסטלים תפוחי אדמה", variants: [["6 יחידות", 30], ["12 יחידות", 56]] },
      { slug: "cigars", name: "סיגרים בשר", variants: [["6 יחידות", 30], ["12 יחידות", 56]] },
      { slug: "kube", name: "קובה בשר", variants: [["6 יחידות", 32]] },
      { slug: "tortilla", name: "טורטיה בשר", variants: [["יחידה", 14]] },
    ],
  },
  {
    slug: "bakery",
    name: "חלות ומאפים",
    description: "חלות לשבת ומאפים מהמגשים בחנות.",
    products: [
      { slug: "challah", name: "חלת סנהדריה", description: "החלה של גישמאק. \"אצלנו זה לא מבצע, זה המחיר הקבוע.\"", image: "/images/real-challah.jpg", featured: true, variants: [["חלה", 10]] },
      { slug: "babka", name: "בבקה שוקולד", description: "שכבות שוקולד עבות, מבריקה מהתנור.", image: "/images/real-babka.jpg", featured: true, variants: [["יחידה", 38]] },
      { slug: "rugelach", name: "רוגלך שוקולד", description: "רוגלך שמרים במילוי שוקולד.", image: "/images/real-rugelach.jpg", variants: [["500 גרם", 32]] },
      { slug: "choc-cake", name: "עוגת שוקולד", description: "עוגה מלבנית עם קישוט קרמל.", image: "/images/real-choc-cake.jpg", variants: [["עוגה", 35]] },
      { slug: "croissant", name: "קרואסון שוקולד", description: "עם פתיתי שוקולד מלמעלה.", image: "/images/real-croissant.jpg", featured: true, variants: [["4 יחידות", 28]] },
    ],
  },
  {
    slug: "wine",
    name: "יינות",
    description: "מבחר יינות על המדף בחנות.",
    products: [
      { slug: "wine-red", name: "יין אדום לשבת", description: "בקבוק מהמבחר שבחנות. סוג מועדף — בהערות להזמנה.", image: "/images/real-wine.jpg", variants: [["בקבוק", 40]] },
      { slug: "grape-juice", name: "מיץ ענבים לקידוש", variants: [["בקבוק", 18]] },
    ],
  },
];

// Thursday = 4, Friday = 5. Store hours: Thu 12:30–24:00, Fri 09:00–14:30.
const WINDOWS = [
  { weekday: 4, startTime: "16:00", endTime: "19:00", capacity: null },
  { weekday: 4, startTime: "19:00", endTime: "22:00", capacity: 30 },
  { weekday: 4, startTime: "22:00", endTime: "23:30", capacity: null },
  { weekday: 5, startTime: "09:00", endTime: "11:00", capacity: 30 },
  { weekday: 5, startTime: "11:00", endTime: "13:30", capacity: 30 },
];

function ilDate(offsetDays = 0) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date(Date.now() + offsetDays * 864e5))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}
function nextWeekday(weekday: number, from = ilDate()) {
  const [y, m, d] = from.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const diff = (weekday - dt.getUTCDay() + 7) % 7;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}
function shift(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

async function main() {
  // settings
  await db.storeSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      phone: "052-5399290",
      whatsapp: "02-5330999",
      address: "משעול הרי״ף (רש״י) 6, קריית יערים",
      hoursText: "חמישי 12:30–24:00 · שישי 09:00–14:30",
    },
  });

  // admin
  const email = (process.env.ADMIN_EMAIL ?? "owner@gishmak.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set. Add it (and ADMIN_EMAIL, SESSION_SECRET) to the Vercel project environment variables.");
  await db.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, name: "משפחת חן", role: "OWNER", passwordHash: await bcrypt.hash(password, 12) },
  });

  // catalog
  for (const [ci, c] of CATALOG.entries()) {
    const cat = await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { slug: c.slug, name: c.name, description: c.description, sortOrder: (ci + 1) * 10 },
    });
    for (const [pi, p] of c.products.entries()) {
      const exists = await db.product.findUnique({ where: { slug: p.slug } });
      if (exists) continue;
      await db.product.create({
        data: {
          slug: p.slug,
          name: p.name,
          description: p.description ?? "",
          imageUrl: p.image ?? null,
          imageIsIllustration: Boolean(p.illustration),
          imageCredit: p.illustration ?? (p.image ? "צילום: גישמאק" : null),
          isFeatured: Boolean(p.featured),
          categoryId: cat.id,
          sortOrder: (pi + 1) * 10,
          variants: { create: p.variants.map(([label, price], i) => ({ label, priceAgorot: price * 100, sortOrder: i })) },
        },
      });
    }
  }

  // pickup windows
  if ((await db.pickupWindow.count()) === 0) {
    for (const [i, w] of WINDOWS.entries()) await db.pickupWindow.create({ data: { ...w, sortOrder: i } });
  }

  const windows = await db.pickupWindow.findMany();
  // sample orders: opt-in, and only into an empty database
  if (process.env.SEED_SAMPLE_ORDERS !== "true" || (await db.order.count()) > 0) {
    console.log(`Seed done (catalog, ${windows.length} pickup windows, admin ${email}). Sample orders skipped.`);
    return;
  }
  const variants = await db.productVariant.findMany({ include: { product: true } });
  const v = (slug: string, idx = 0) => {
    const list = variants.filter((x) => x.product.slug === slug).sort((a, b) => a.sortOrder - b.sortOrder);
    return list[Math.min(idx, list.length - 1)];
  };
  const thu = nextWeekday(4);
  const fri = nextWeekday(5);
  const lastFri = shift(fri, -7);
  const win = (date: string, start: string) => {
    const [y, m, d] = date.split("-").map(Number);
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return windows.find((w) => w.weekday === wd && w.startTime === start)!;
  };

  type Sample = {
    name: string;
    phone: string;
    date: string;
    start: string;
    status: string;
    notes?: string;
    recipient?: string;
    hoursAgo: number;
    items: [slug: string, variantIdx: number, qty: number][];
  };
  const samples: Sample[] = [
    { name: "יעקב פרידמן", phone: "050-0000102", date: lastFri, start: "09:00", status: "PICKED_UP", hoursAgo: 200, items: [["cholent", 2, 1], ["kugel-potato", 1, 1], ["challah", 0, 3]] },
    { name: "נחמה לוין", phone: "052-0000110", date: lastFri, start: "11:00", status: "PICKED_UP", hoursAgo: 190, items: [["cholent", 1, 1], ["hummus", 1, 1], ["challah", 0, 2]] },
    { name: "אסתר וייס", phone: "054-0000107", date: lastFri, start: "09:00", status: "CANCELLED", hoursAgo: 210, items: [["cholent", 0, 1]] },
    { name: "רחל כהן", phone: "050-0000101", date: fri, start: "09:00", status: "CONFIRMED", hoursAgo: 30, notes: "בלי ביצים בצ׳ולנט אם אפשר", items: [["cholent", 1, 2], ["kugel-yerushalmi", 1, 1], ["chopped-liver", 1, 1], ["challah", 0, 4]] },
    { name: "מנחם רוזן", phone: "053-0000104", date: thu, start: "19:00", status: "NEW", hoursAgo: 3, notes: "יין: אדום יבש", items: [["cholent", 1, 1], ["kugel-yerushalmi", 0, 2], ["gefilte", 1, 1], ["challah", 0, 3], ["wine-red", 0, 1]] },
    { name: "חיה ברגר", phone: "058-0000105", date: fri, start: "09:00", status: "NEW", hoursAgo: 2, recipient: "שמואל ברגר", notes: "האיסוף על ידי הבן, שמואל", items: [["chopped-liver", 0, 2], ["hummus", 0, 1], ["tahini", 0, 1], ["rugelach", 0, 1]] },
    { name: "דוד שטרן", phone: "050-0000106", date: fri, start: "11:00", status: "CONFIRMED", hoursAgo: 40, notes: "משפחה של 9 — לארוז את העוף בנפרד", items: [["cholent", 2, 1], ["grill-chicken", 1, 1], ["rice", 1, 1], ["cigars", 1, 1]] },
    { name: "שרה גולדברג", phone: "052-0000103", date: thu, start: "16:00", status: "NEW", hoursAgo: 1, items: [["cholent", 0, 2], ["kugel-sweet", 0, 1], ["matbucha", 0, 1], ["eggplant-liver", 0, 1], ["babka", 0, 1]] },
    { name: "משה קליין", phone: "054-0000108", date: fri, start: "11:00", status: "NEW", hoursAgo: 5, items: [["cholent", 1, 1], ["kugel-yerushalmi", 1, 1], ["herring", 1, 1], ["challah", 0, 2]] },
    { name: "לאה אברמוביץ", phone: "055-0000109", date: thu, start: "19:00", status: "CONFIRMED", hoursAgo: 26, notes: "להתקשר לפני ההכנה", items: [["chopped-liver", 1, 1], ["matbucha", 1, 1], ["challah", 0, 3]] },
  ];

  const settings = await db.storeSettings.findUnique({ where: { id: 1 } });
  let no = settings?.nextOrderNumber ?? 1001;
  for (const s of samples) {
    const w = win(s.date, s.start);
    const lines = s.items.map(([slug, idx, qty]) => {
      const vv = v(slug, idx);
      return { productId: vv.productId, variantId: vv.id, productName: vv.product.name, variantLabel: vv.label, unitPriceAgorot: vv.priceAgorot, quantity: qty, lineTotalAgorot: vv.priceAgorot * qty };
    });
    const total = lines.reduce((a, l) => a + l.lineTotalAgorot, 0);
    const createdAt = new Date(Date.now() - s.hoursAgo * 3600e3);
    const events: { type: string; fromStatus?: string; toStatus?: string; message: string; createdAt: Date }[] = [
      { type: "CREATED", toStatus: "NEW", message: "ההזמנה התקבלה מהאתר", createdAt },
    ];
    if (s.status !== "NEW") events.push({ type: "STATUS_CHANGED", fromStatus: "NEW", toStatus: s.status, message: "עודכן ידנית", createdAt: new Date(createdAt.getTime() + 3600e3) });
    await db.order.create({
      data: {
        orderNumber: no++,
        publicToken: randomBytes(12).toString("base64url"),
        status: s.status,
        customerName: s.name,
        customerPhone: s.phone,
        recipientName: s.recipient ?? null,
        notes: s.notes ?? "",
        pickupDate: s.date,
        pickupWindowId: w.id,
        pickupStart: w.startTime,
        pickupEnd: w.endTime,
        subtotalAgorot: total,
        totalAgorot: total,
        paymentStatus: s.status === "PICKED_UP" ? "PAID" : "UNPAID",
        createdAt,
        items: { create: lines },
        events: { create: events },
      },
    });
  }
  await db.storeSettings.update({ where: { id: 1 }, data: { nextOrderNumber: Math.max(no, settings?.nextOrderNumber ?? 0) } });
  console.log(`Seeded catalog, ${windows.length} pickup windows, ${samples.length} sample orders. Admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
