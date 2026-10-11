import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./session";

export type AdminSession = { id: string; name: string; email: string; role: string };

/** Returns the signed-in, still-active admin or null. */
export async function getAdmin(): Promise<AdminSession | null> {
  const jar = await cookies();
  const payload = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const user = await db.adminUser.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** For admin pages and server actions — never trust the middleware alone. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

// Simple in-memory throttle: 8 failed attempts per 15 minutes per key.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;

export function isThrottled(key: string): boolean {
  const a = attempts.get(key);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return a.count >= MAX_FAILS;
}
function recordFailure(key: string) {
  const a = attempts.get(key);
  if (!a || Date.now() - a.first > WINDOW_MS) attempts.set(key, { count: 1, first: Date.now() });
  else a.count++;
}

export async function loginWithPassword(email: string, password: string, throttleKey: string) {
  if (isThrottled(throttleKey)) return { ok: false as const, error: "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות." };
  const user = await db.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  const valid = user && user.isActive && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !valid) {
    recordFailure(throttleKey);
    return { ok: false as const, error: "אימייל או סיסמה שגויים" };
  }
  attempts.delete(throttleKey);
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = await signSession({ sub: user.id, name: user.name, role: user.role });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return { ok: true as const };
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
