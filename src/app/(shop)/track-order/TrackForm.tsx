"use client";
import { useActionState } from "react";
import { trackOrder } from "./actions";
import { INDIA_POST_TRACKING_URL } from "@/config/shop";

export function TrackForm() {
  const [result, action, pending] = useActionState(trackOrder, undefined);
  return (
    <>
      <form action={action} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">Order number</span>
          <input name="order_number" placeholder="AMR1001" required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">Email used for the order</span>
          <input name="email" type="email" required />
        </label>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Checking…" : "Track order"}
        </button>
      </form>

      {result && "error" in result && <p role="alert" className="mt-5 text-sm text-sale">{result.error}</p>}
      {result && "orderNumber" in result && (
        <section aria-live="polite" className="mt-6 border-t border-sand pt-6">
          <h2 className="font-display text-2xl">Order {result.orderNumber}</h2>
          <p className="mt-1 text-sm">Status: <strong>{result.status}</strong></p>
          {result.consignment ? (
            <div className="mt-4 bg-cream p-4 text-sm">
              <p>{result.carrier ?? "India Post"} consignment number</p>
              <p className="mt-1 font-display text-2xl tracking-wider">{result.consignment}</p>
              {!result.isInternational && (
                <a href={INDIA_POST_TRACKING_URL} target="_blank" rel="noopener noreferrer" className="btn-outline mt-4">
                  Track on India Post
                </a>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Not dispatched yet. We&apos;ll email you the consignment number once it ships.</p>
          )}
        </section>
      )}
    </>
  );
}
