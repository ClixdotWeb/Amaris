import { ProductListing } from "@/components/product/ProductListing";

export const metadata = { title: "Premium" };

export default async function PremiumPage({ searchParams }: { searchParams: Promise<{ sort?: string; page?: string }> }) {
  return (
    <ProductListing
      title="Premium"
      description="Our finest pieces."
      basePath="/premium"
      searchParams={await searchParams}
      filter={{ premium: true }}
    />
  );
}
