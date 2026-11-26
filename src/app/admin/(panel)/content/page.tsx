import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { DEFAULT_HOME, withDefaults } from "@/lib/content/defaults";
import { PageHeader } from "@/components/admin/ui";
import { ContentForm } from "./ContentForm";

export const metadata = { title: "Homepage" };

export default async function ContentPage() {
  await requireAdmin("/admin/content");
  const [content, collections] = await Promise.all([db.content.get(), db.collections.list()]);
  // Fill the editor with what the shop shows now (saved values, or the built-in ones)
  const current = withDefaults(content);
  return (
    <>
      <PageHeader eyebrow="Marketing" title="Homepage" description="Change the slides, messages, tiles and featured collections on the shop's home page. Empty fields use the built-in text and photos." />
      <ContentForm
        content={{ ...current, announcements: content.announcements?.length ? content.announcements : current.announcements }}
        defaults={DEFAULT_HOME}
        collections={collections.map((c) => ({ id: c.id, name: c.name, count: c.product_ids.length, active: c.is_active }))}
      />
    </>
  );
}
