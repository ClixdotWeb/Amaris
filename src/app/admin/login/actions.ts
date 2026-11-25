"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ADMIN_COOKIE, ADMIN_SESSION_HOURS, createSessionToken, sessionConfigured } from "@/lib/admin/session";
import { adminLoginConfigured, checkAdminCredentials } from "@/lib/admin/accounts";
import { getAdmin } from "@/lib/admin/guard";
import { logActivity } from "@/lib/admin/activity";
import { clearFailures, isBlocked, recordFailure } from "@/lib/admin/rateLimit";

import { db } from "@/lib/db";

/** Wrong passwords allowed per 15 minutes from one connection; successful sign-ins don't count. */
const MAX_FAILURES = 5;
const WINDOW_SEC = 15 * 60;

export type LoginState = { error?: string } | undefined;

const schema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

/** Only admin paths on this site, never an outside URL. */
const safeNext = (n?: string) => (n && n.startsWith("/admin") && !n.startsWith("//") ? n : "/admin");

export async function adminLogin(_: LoginState, form: FormData): Promise<LoginState> {
  if (!sessionConfigured() || !(await adminLoginConfigured()))
    return { error: "Admin sign-in isn't set up yet. See docs/ADMIN_SETUP.md." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `admin-login:${ip}`;
  const blocked = isBlocked(key, MAX_FAILURES);
  if (!blocked.ok) {
    const min = Math.ceil(blocked.retryAfterSec / 60);
    return { error: `Too many wrong passwords. Try again in ${min} minute${min === 1 ? "" : "s"}.` };
  }

  const parsed = schema.safeParse(Object.fromEntries(form));
  const admin = parsed.success ? await checkAdminCredentials(parsed.data.email, parsed.data.password) : null;
  if (!parsed.success || !admin) {
    recordFailure(key, WINDOW_SEC);
    return { error: "Incorrect email or password." };
  }
  clearFailures(key);

  (await cookies()).set(ADMIN_COOKIE, await createSessionToken(admin.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_HOURS * 3600,
  });
  await db.admins.touchLogin(admin.id);
  await logActivity(admin, { action: "session.login", entity_type: "session", summary: "Signed in" });
  redirect(safeNext(parsed.data.next));
}

export async function adminLogout() {
  const admin = await getAdmin();
  if (admin) await logActivity(admin, { action: "session.logout", entity_type: "session", summary: "Signed out" });
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
