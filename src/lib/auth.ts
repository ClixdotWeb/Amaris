import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { USE_MOCK } from "@/lib/data/mode";
import type { Profile } from "@/types";

/** Stand-in user for preview mode so account/checkout pages can be designed without a database. */
const PREVIEW_USER = { id: "preview", email: "preview@amaris.test" } as User;

export async function getUser() {
  if (USE_MOCK) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser(next = "/account") {
  if (USE_MOCK) return PREVIEW_USER;
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  if (USE_MOCK) return { id: "preview", full_name: "Guest", phone: null, is_admin: false };
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

/** Use at the top of every admin page / server action. */
export async function requireAdmin() {
  const user = await requireUser("/admin");
  const profile = await getProfile();
  if (!profile?.is_admin) redirect("/");
  return user;
}
