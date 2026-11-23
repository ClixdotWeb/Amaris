import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/data/products";
import { ProductListing } from "@/components/product/ProductListing";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).category);
  return { title: category?.name ?? "Shop" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <ProductListing
      title={category.name}
      description={category.description}
      basePath={`/shop/${slug}`}
      searchParams={await searchParams}
      filter={{ categorySlug: slug }}
    />
  );
}
