"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { hashPassword, MIN_PASSWORD } from "@/lib/admin/accounts";
import { logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";
import type { ActionResult } from "@/components/admin/ConfirmButton";

export type AddAdminState = { ok?: string; error?: string; fieldErrors?: Partial<Record<"full_name" | "email" | "password", string>> } | undefined;

const addSchema = z.object({
  full_name: z.string().trim().min(2, "Enter their name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  password: z.string().min(MIN_PASSWORD, `At least ${MIN_PASSWORD} characters.`).max(200),
});

/** Add an admin with a starting password (shared with them in person or by phone). */
export async function addAdmin(_: AddAdminState, form: FormData): Promise<AddAdminState> {
  const me = await requireAdmin("/admin/users");
  const parsed = addSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: NonNullable<AddAdminState>["fieldErrors"] = {};
    for (const i of parsed.error.issues) fieldErrors[i.path[0] as "full_name" | "email" | "password"] ??= i.message;
    return { error: "Check the highlighted fields.", fieldErrors };
  }
  const { full_name, email, password } = parsed.data;
  const result = await db.admins.add({ full_name, email, password_hash: await hashPassword(password), created_by: me.email });
  if (!result.ok) return { error: result.error, fieldErrors: { email: result.error } };

  await logActivity(me, { action: "admin.add", entity_type: "admin", entity_id: result.id, summary: `Added admin ${email}` });
  revalidatePath("/admin/users");
  return { ok: `${full_name} can now sign in as an admin.` };
}

/** Remove another admin. You can't remove yourself or the last admin. */
export async function removeAdmin(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/users");
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Admin not found." };
  const target = (await db.admins.list()).find((a) => a.id === id.data);
  if (!target) return { error: "Admin not found." };
  if (target.email === me.email) return { error: "You can't remove your own account. Ask another admin." };

  const result = await db.admins.remove(id.data);
  if (!result.ok) return { error: result.error };
  await logActivity(me, { action: "admin.remove", entity_type: "admin", entity_id: id.data, summary: `Removed admin ${target.email}` });
  revalidatePath("/admin/users");
  return { ok: `${target.email} can no longer sign in.` };
}
