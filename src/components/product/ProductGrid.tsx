import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { ProductWithRelations } from "@/types";

export function ProductGrid({ products }: { products: ProductWithRelations[] }) {
  if (!products.length)
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl">No products here yet</p>
        <p className="mt-2 text-sm text-muted">New pieces arrive every week. Please check back soon.</p>
        <Link href="/new-arrivals" className="btn-outline mt-6">See New Arrivals</Link>
      </div>
    );
  return (
    <ul data-reveal-stagger className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-14">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
