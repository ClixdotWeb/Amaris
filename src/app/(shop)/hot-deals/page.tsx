import { ProductListing } from "@/components/product/ProductListing";

export const metadata = { title: "Hot Deals" };

export default async function HotDealsPage({ searchParams }: { searchParams: Promise<{ sort?: string; page?: string }> }) {
  return (
    <ProductListing
      title="Hot Deals"
      description="Special prices on selected pieces, while stocks last."
      basePath="/hot-deals"
      searchParams={await searchParams}
      filter={{ hotDeals: true }}
    />
  );
}
