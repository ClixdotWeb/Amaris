/** Checkout / payment outline while it loads. */
export default function CheckoutLoading() {
  return (
    <div aria-busy aria-label="Loading checkout">
      <div className="h-48 bg-maroon-dark/95 md:h-64" />
      <div className="container-x py-12">
        <div className="mx-auto h-8 max-w-2xl animate-pulse bg-cream/70" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
          <div className="card h-96 animate-pulse" />
          <div className="card h-80 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
