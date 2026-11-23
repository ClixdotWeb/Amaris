import { createClient } from "@/lib/supabase/server";
import { USE_MOCK } from "@/lib/data/mode";
import { deleteAddress, setDefaultAddress } from "./actions";
import { AddressForm } from "./AddressForm";
import type { Address } from "@/types";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  let addresses: Address[] = [];
  if (!USE_MOCK) {
    const supabase = await createClient();
    const { data } = await supabase.from("addresses").select("*").order("created_at");
    addresses = (data ?? []) as Address[];
  }

  return (
    <section className="space-y-10">
      <div>
        <h2 className="mb-6 font-display text-3xl">Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted">No saved addresses yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className={`card p-5 text-sm ${a.is_default ? "border-maroon" : ""}`}>
                <p className="font-medium">{a.full_name}</p>
                <address className="mt-1 leading-relaxed text-muted not-italic">
                  {a.line1}
                  {a.line2 && `, ${a.line2}`}
                  <br />
                  {a.city}, {a.state} {a.pincode}, {a.country}
                  <br />
                  {a.phone}
                </address>
                <div className="mt-4 flex items-center gap-4 text-xs">
                  {a.is_default ? (
                    <span className="tracking-wider text-maroon uppercase">Default</span>
                  ) : (
                    <form action={setDefaultAddress}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="underline underline-offset-4">Make default</button>
                    </form>
                  )}
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-muted hover:text-sale">Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-6 md:p-8">
        <h3 className="mb-6 font-display text-2xl">Add a new address</h3>
        <AddressForm />
      </div>
    </section>
  );
}
