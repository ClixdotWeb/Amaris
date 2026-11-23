import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";

/** Storefront chrome. The admin panel has its own layout without this. */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
      <MobileTabBar />
    </>
  );
}
