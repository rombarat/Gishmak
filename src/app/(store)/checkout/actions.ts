"use server";

import { revalidatePath } from "next/cache";
import { placeOrder, type PlaceOrderResult } from "@/server/orders";
import type { CheckoutInput } from "@/domain/checkout";

export async function submitOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  try {
    const result = await placeOrder(input);
    if (result.ok) {
      revalidatePath("/admin", "layout");
    }
    return result;
  } catch (e) {
    console.error("submitOrder failed", e);
    return { ok: false, error: "משהו השתבש בשליחת ההזמנה. ההזמנה לא נקלטה — נסו שוב, או התקשרו אלינו." };
  }
}
