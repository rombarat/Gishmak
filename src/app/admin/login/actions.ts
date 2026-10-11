"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginWithPassword } from "@/lib/auth";

export type LoginState = { error?: string; email?: string };

/** Only same-site admin paths — never an open redirect. */
function safeNext(raw: FormDataEntryValue | null): string {
  const next = typeof raw === "string" ? raw : "";
  return /^\/admin(\/[\w\-/]*)?(\?[\w\-=&%]*)?$/.test(next) && !next.startsWith("/admin/login") ? next : "/admin";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "נא למלא אימייל וסיסמה", email };

  const h = await headers();
  const throttleKey = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const result = await loginWithPassword(email, password, throttleKey);
  if (!result.ok) return { error: result.error, email };
  redirect(safeNext(formData.get("next")));
}
