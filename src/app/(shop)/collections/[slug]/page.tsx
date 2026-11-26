import { notFound } from "next/navigation";
import { ProductListing } from "@/components/product/ProductListing";
import { getCollection } from "@/lib/data/content";

/** A collection made in the dashboard (Collections), with its own products in the order chosen there. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getCollection((await params).slug);
  return { title: c?.name ?? "Collection" };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c) notFound();
  return (
    <ProductListing
      title={c.name}
      description={c.description ?? undefined}
      basePath={`/collections/${c.slug}`}
      searchParams={await searchParams}
      filter={{ collectionSlug: c.slug }}
    />
  );
}
