import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/settings";
import { USE_MOCK } from "@/lib/data/mode";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Address } from "@/types";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const settings = await getSettings();
  let addresses: Address[] = [];
  if (!USE_MOCK) {
    const supabase = await createClient();
    const { data } = await supabase.from("addresses").select("*").order("is_default", { ascending: false });
    addresses = (data ?? []) as Address[];
  }

  return (
    <>
      <PageHeader title="Checkout" />
      <div className="container-x py-12">
        <CheckoutForm
          preview={USE_MOCK}
          email={USE_MOCK ? "" : (user.email ?? "")}
          savedAddresses={addresses}
          settings={{
            shipping_kerala_per_item: settings.shipping_kerala_per_item,
            shipping_india_per_item: settings.shipping_india_per_item,
            free_shipping_above: settings.free_shipping_above,
            international_rates: settings.international_rates,
          }}
        />
      </div>
    </>
  );
}
