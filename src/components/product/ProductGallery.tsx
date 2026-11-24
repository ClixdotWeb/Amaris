"use client";
import type { ProductImage } from "@/types";
import { useProductImage } from "./ProductView";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const { image, setImage } = useProductImage();
  if (!images.length) return <div className="aspect-[3/4] bg-cream" />;
  const active = Math.min(image, images.length - 1);
  const current = images[active];

  return (
    <div className="flex min-w-0 flex-col-reverse gap-3 md:flex-row md:gap-4">
      {images.length > 1 && (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible lg:max-h-[calc(100svh-8rem)] lg:overflow-y-auto">
          {images.map((img, i) => (
            <li key={img.id} className="w-20 shrink-0">
              <button
                type="button"
                onClick={() => setImage(i)}
                aria-label={`Show image ${i + 1}`}
                aria-pressed={i === active}
                className={`block aspect-[3/4] w-full overflow-hidden border transition ${i === active ? "border-maroon" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                <img src={img.thumb_url ?? img.url} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* Desktop: never taller than the window (pinned beside the scrolling details), so the whole outfit stays in view */}
      <div className="group relative aspect-[3/4] flex-1 overflow-hidden bg-cream lg:max-w-[calc((100svh-8rem)*0.75)]">
        <img src={current.url} alt={current.alt ?? name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
    </div>
  );
}
