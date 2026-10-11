import "server-only";
import { db } from "@/lib/db";

export async function getSettings() {
  return (await db.storeSettings.findUnique({ where: { id: 1 } })) ?? (await db.storeSettings.create({ data: { id: 1 } }));
}
