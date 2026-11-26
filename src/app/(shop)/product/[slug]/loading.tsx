/** Product page outline while it loads: photo on the left, details on the right. */
export default function ProductLoading() {
  return (
    <div aria-busy aria-label="Loading product" className="container-x pt-6 pb-16">
      <div className="mb-6 h-3 w-40 animate-pulse bg-cream" />
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="grid grid-cols-[80px_1fr] gap-4">
          <div className="space-y-3">
            {[0, 1, 2].map((n) => (
              <div key={n} className="aspect-[3/4] animate-pulse bg-cream" />
            ))}
          </div>
          <div className="aspect-[3/4] animate-pulse bg-cream" />
        </div>
        <div className="space-y-5 pt-2">
          <div className="h-3 w-24 animate-pulse bg-cream" />
          <div className="h-10 w-4/5 animate-pulse bg-cream" />
          <div className="h-6 w-32 animate-pulse bg-cream" />
          <div className="my-8 h-px bg-sand" />
          <div className="h-12 w-44 animate-pulse bg-cream" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-14 animate-pulse bg-cream" />
            <div className="h-14 animate-pulse bg-maroon/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
