import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { listCollections } from "@/lib/data/content";
import { listProducts } from "@/lib/data/products";

export const metadata = { title: "Collections" };

/** All active collections from the dashboard, each with a cover (its own photo or its first product's). */
export default async function CollectionsPage() {
  const collections = await listCollections();
  const covers = await Promise.all(
    collections.map(async (c) => {
      if (c.image_url) return c.image_url;
      const first = (await listProducts({ collectionSlug: c.slug, limit: 1 })).products[0];
      return first?.images[0]?.thumb_url ?? first?.images[0]?.url ?? null;
    }),
  );
  return (
    <>
      <PageHeader title="Collections" />
      <div className="container-x py-12">
        {collections.length === 0 ? (
          <p className="text-center text-muted">No collections yet.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c, i) => (
              <li key={c.id}>
                <Link href={`/collections/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-cream">
                  {covers[i] && <img src={covers[i]!} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                    <h2 className="font-display text-3xl">{c.name}</h2>
                    {c.description && <p className="mt-1 text-sm text-ivory/80">{c.description}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
