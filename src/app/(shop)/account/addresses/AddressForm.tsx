"use client";
import { useActionState, useState } from "react";
import { saveAddress } from "./actions";
import { AddressFields } from "@/components/checkout/AddressFields";
import type { ShippingAddress } from "@/types";

const EMPTY: ShippingAddress = { full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "IN" };

export function AddressForm() {
  const [address, setAddress] = useState(EMPTY);
  const [state, action, pending] = useActionState(saveAddress, undefined);

  return (
    <form action={action} className="space-y-5">
      <AddressFields value={address} onChange={setAddress} countries={[]} />
      {Object.entries(address).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v ?? ""} />
      ))}
      {state && "error" in state && <p role="alert" className="text-sm text-sale">{state.error}</p>}
      {state && "ok" in state && <p role="status" className="text-sm text-success">Address saved.</p>}
      <button type="submit" disabled={pending} className="btn-primary">Save address</button>
    </form>
  );
}
