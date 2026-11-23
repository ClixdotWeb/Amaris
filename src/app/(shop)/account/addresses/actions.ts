"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validation";

export async function saveAddress(_: unknown, form: FormData) {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid address" };

  const supabase = await createClient();
  const id = form.get("id");
  const row = { ...parsed.data, user_id: user.id };
  const { error } = id
    ? await supabase.from("addresses").update(row).eq("id", String(id))
    : await supabase.from("addresses").insert(row);
  if (error) return { error: "Could not save address." };
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddress(form: FormData) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", String(form.get("id")));
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(form: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  await supabase.from("addresses").update({ is_default: true }).eq("id", String(form.get("id")));
  revalidatePath("/account/addresses");
}
