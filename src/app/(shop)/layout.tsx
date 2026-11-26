import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { getHomeContent } from "@/lib/data/content";
import { wallpaperCss } from "@/lib/content/wallpaper";

/** Storefront chrome. The admin panel has its own layout without this. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Wallpaper chosen in the dashboard (Homepage → Website wallpaper); none = the stylesheet's damask
  const css = wallpaperCss((await getHomeContent()).wallpaper);
  return (
    <>
      {css && <style data-wallpaper>{css}</style>}
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
