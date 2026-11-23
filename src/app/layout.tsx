import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";
import { CartProvider } from "@/components/cart/CartProvider";
import { RevealObserver } from "@/components/layout/RevealObserver";
import { ParallaxController } from "@/components/layout/ParallaxController";

// Placeholder fonts until the client sends brand fonts. Change here + --font-* in globals.css.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});
const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-jost" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description:
    "Amaris Boutique, Paika, Kerala: salwar suits, sarees, co-ord sets, custom-made kurtis and kids dresses, running material and home linen.",
};

/**
 * Runs before first paint: enables scroll-reveal styles so below-the-fold content starts hidden (no flash).
 * Fallback: if the app's JS never starts (RevealObserver sets window.__amarisReveal), un-hide everything after 3 s.
 */
const revealBootstrap = `(function(){var d=document.documentElement;if(!window.matchMedia||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('reveal-ready');setTimeout(function(){if(!window.__amarisReveal)d.classList.remove('reveal-ready')},3000)})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootstrap }} />
      </head>
      <body className="min-h-screen">
        <CartProvider>{children}</CartProvider>
        <RevealObserver />
        <ParallaxController />
      </body>
    </html>
  );
}
