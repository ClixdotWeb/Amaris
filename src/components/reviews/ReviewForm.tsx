"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/(shop)/product/[slug]/actions";

/** Write-a-review form under the product. Saved as pending until the shop approves it. */
export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(submitReview, undefined);
  const [rating, setRating] = useState(0);
  if (state?.ok) return <p className="border border-sand bg-cream/50 p-5 text-sm">{state.ok}</p>;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <fieldset>
        <legend className="mb-2 text-[12px] tracking-[0.14em] uppercase">Your rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
              className="p-0.5 text-gold"
            >
              <Star size={22} strokeWidth={1.4} fill={n <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[12px] tracking-[0.14em] uppercase">Name</span>
          <input name="name" required maxLength={60} autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] tracking-[0.14em] uppercase">Title (optional)</span>
          <input name="title" maxLength={80} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[12px] tracking-[0.14em] uppercase">Review</span>
        <textarea name="body" required minLength={10} maxLength={1000} rows={4} />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-sale">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
