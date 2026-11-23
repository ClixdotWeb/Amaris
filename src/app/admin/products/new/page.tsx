import { listCategories } from "@/lib/data/products";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const categories = await listCategories();
  return (
    <section>
      <h1>Add product</h1>
      <ProductForm categories={categories} />
    </section>
  );
}
