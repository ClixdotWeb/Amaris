import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Shop settings" };

export default async function AdminSettingsPage() {
  const settings = await db.settings.get();
  return (
    <>
      <PageHeader eyebrow="Settings" title="Shop settings" description="Stitching and shipping charges used in the cart and at checkout." />
      <SettingsForm settings={settings} />
    </>
  );
}
