import Link from "next/link";

/**
 * Brand logo (public/Assets/logo-dark.png and logo-light.png, cut out from the client's logo artwork).
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
          {img("/Assets/logo-dark.png", "logo-dark")}
          {img("/Assets/logo-light.png", "logo-light")}
        </>
      ) : (
        img(light ? "/Assets/logo-light.png" : "/Assets/logo-dark.png")
      )}
    </Link>
  );
}
