import { ProductListing } from "@/components/product/ProductListing";

export const metadata = { title: "New Arrivals" };

export default async function NewArrivalsPage({ searchParams }: { searchParams: Promise<{ sort?: string; page?: string }> }) {
  return (
    <ProductListing
      title="New Arrivals"
      description="The latest pieces to arrive at Amaris Boutique."
      basePath="/new-arrivals"
      searchParams={await searchParams}
      filter={{ newArrivals: true }}
    />
  );
}
