import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "./session";
import { isAdminEmail } from "./accounts";

export type Admin = { email: string };

/**
 * The logged-in admin, or null. The account must still exist, so removing an admin ends their access at once.
 * Cached per request (layout + page + action share one check).
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const session = await verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session || !(await isAdminEmail(session.email))) return null;
  return { email: session.email };
});

/**
 * Call at the top of EVERY admin page, server action and route handler.
 * Middleware also checks, but this is the check that counts: it runs next to the data.
 * (scripts/check-admin-guards.mjs fails if an admin action or route forgets it.)
 */
export async function requireAdmin(next = "/admin"): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  return admin;
}
