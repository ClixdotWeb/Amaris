"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import { logActivity } from "@/lib/admin/activity";
import { db } from "@/lib/db";
import type { ActionResult } from "@/components/admin/ConfirmButton";

export async function setCustomerBlocked(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/customers");
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Customer not found." };
  const block = form.get("block") === "on";
  const c = await db.customers.update(id.data, { is_blocked: block });
  if (!c) return { error: "Customer not found." };
  await logActivity(me, { action: block ? "customer.block" : "customer.unblock", entity_type: "customer", entity_id: c.id, summary: `${block ? "Blocked" : "Unblocked"} ${c.full_name} (${c.email})` });
  revalidatePath(`/admin/customers/${c.id}`);
  revalidatePath("/admin/customers");
  return { ok: block ? `${c.full_name} is blocked.` : `${c.full_name} is unblocked.` };
}

export async function saveCustomerNotes(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireAdmin("/admin/customers");
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Customer not found." };
  const notes = String(form.get("notes") ?? "").trim().slice(0, 1000) || null;
  const c = await db.customers.update(id.data, { notes });
  if (!c) return { error: "Customer not found." };
  await logActivity(me, { action: "customer.notes", entity_type: "customer", entity_id: c.id, summary: `Updated notes for ${c.full_name}` });
  revalidatePath(`/admin/customers/${c.id}`);
  return { ok: "Notes saved." };
}
