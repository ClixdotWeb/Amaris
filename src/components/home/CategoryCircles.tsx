import Link from "next/link";
import { categoryPhoto } from "@/lib/data/mock";
import { listCategories } from "@/lib/data/products";

const SHORT: Record<string, string> = {
  "unstitched-salwar-suits": "Unstitched Suits",
  "frocks-kurtis": "Frocks & Kurtis",
  "kids-dresses": "Kids Dresses",
};

const BURGUNDY = "#6e1f2a";
const EASE = "cubic-bezier(0.65,0,0.35,1)";

/**
 * Round category tiles. Hover/focus: a burgundy ring *draws* itself around the circle from the top
 * (SVG stroke-dashoffset), the photo zooms gently, and the label turns burgundy with a growing hairline.
 * TODO: replace photos with the client's own category images.
 */
export async function CategoryCircles() {
  // Order, names, photos and visibility come from the dashboard (Categories)
  const categories = await listCategories();
  return (
    <ul
      data-reveal-stagger
      className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 pt-2 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-10 md:overflow-visible md:px-0 lg:grid-cols-8 lg:gap-8"
    >
      {categories.map((c) => {
        const photo = c.image_url || categoryPhoto(c.slug, 420);
        return (
          <li key={c.slug} className="w-28 shrink-0 md:w-auto">
            <Link href={`/shop/${c.slug}`} className="group flex flex-col items-center text-center outline-none">
              <span className="relative block aspect-square w-full">
                {/* Resting hairline ring */}
                <span aria-hidden className="absolute -inset-[7px] rounded-full border border-sand/90" />

                {/* Burgundy ring that draws on hover / keyboard focus */}
                <svg aria-hidden viewBox="0 0 100 100" className="pointer-events-none absolute -inset-[7px] h-[calc(100%+14px)] w-[calc(100%+14px)] -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="49.4"
                    fill="none"
                    stroke={BURGUNDY}
                    strokeWidth="1.1"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeLinecap="round"
                    className="[stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[1100ms] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
                    style={{ transitionTimingFunction: EASE }}
                  />
                </svg>

                {/* Photo */}
                <span className="absolute inset-0 overflow-hidden rounded-full bg-cream">
                  {photo && (
                    <img
                      src={photo}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-[scale,filter] duration-[1100ms] group-hover:scale-[1.1] group-hover:saturate-[1.08] group-focus-visible:scale-[1.1]"
                      style={{ transitionTimingFunction: EASE }}
                    />
                  )}
                  {/* Soft inner shade that lifts on hover */}
                  <span aria-hidden className="absolute inset-0 rounded-full bg-[#350f10]/10 transition-opacity duration-700 group-hover:opacity-0" />
                </span>
              </span>

              <span className="relative mt-6 pb-1.5 text-[11px] leading-snug tracking-[0.18em] uppercase transition-colors duration-500 group-hover:text-maroon group-focus-visible:text-maroon">
                {SHORT[c.slug] ?? c.name}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 mx-auto h-px w-0 bg-maroon transition-[width] duration-700 group-hover:w-full group-focus-visible:w-full"
                  style={{ transitionTimingFunction: EASE }}
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
