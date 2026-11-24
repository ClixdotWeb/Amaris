import Link from "next/link";
import { cloudImage, LOGO_WIDTH } from "@/lib/images";

const LOGO_DARK = cloudImage("/Assets/logo-dark.png", LOGO_WIDTH);
const LOGO_LIGHT = cloudImage("/Assets/logo-light.png", LOGO_WIDTH);

/**
 * Brand logo (amaris/site/logo-dark and logo-light on Cloudinary; local copies in public/Assets/).
 * `light` = version for dark backgrounds (footer).
 * `swap`  = render both; CSS shows the light one when the header sits over the dark hero (globals.css).
 */
export function Logo({
  light = false,
  swap = false,
  className = "h-[58px] md:h-[76px]",
}: {
  light?: boolean;
  swap?: boolean;
  className?: string;
}) {
  const img = (src: string, cls = "") => (
    <img src={src} alt="Amaris Boutique" width={556} height={435} className={`w-auto ${className} ${cls}`} />
  );
  return (
    <Link href="/" className={`inline-flex shrink-0 ${swap ? "logo-swap" : ""}`} aria-label="Amaris Boutique home">
      {swap ? (
        <>
          {img(LOGO_DARK, "logo-dark")}
          {img(LOGO_LIGHT, "logo-light")}
        </>
      ) : (
        img(light ? LOGO_LIGHT : LOGO_DARK)
      )}
    </Link>
  );
}
