import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  const categories = await db.categories.list();
  return (
    <>
      <PageHeader title="Add product" back={{ href: "/admin/products", label: "All products" }} />
      <ProductForm categories={categories} />
    </>
  );
}
