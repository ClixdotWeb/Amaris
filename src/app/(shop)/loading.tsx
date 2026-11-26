/** Shown the moment a customer clicks a link, while the next page loads (no frozen screen). */
export default function ShopLoading() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="h-48 bg-maroon-dark/95 md:h-64" />
      <div className="container-x py-12">
        <div className="mx-auto mb-10 h-3 w-40 animate-pulse bg-cream" />
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <div className="aspect-[3/4] animate-pulse bg-cream" />
              <div className="mt-4 h-3 w-3/4 animate-pulse bg-cream" />
              <div className="mt-2 h-3 w-1/3 animate-pulse bg-cream" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
