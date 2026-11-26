import "server-only";
import { db } from "@/lib/db";
import type { PickerProduct } from "@/components/admin/ProductPicker";

/** Every product that isn't deleted, in the small shape the product picker needs. */
export async function pickerProducts(): Promise<PickerProduct[]> {
  const { rows } = await db.products.list({ sort: "name", page: 1, pageSize: 5000 });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.images[0]?.thumb_url ?? p.images[0]?.url ?? null,
    category: p.category.name,
    live: p.is_active,
  }));
}
