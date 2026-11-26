"use client";
import { useState } from "react";
import { PenLine, X } from "lucide-react";
import { ReviewForm } from "./ReviewForm";
import { Stars } from "./Stars";
import { SectionHeading } from "@/components/home/SectionHeading";
import type { Review } from "@/types";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * Product reviews: summary (average, stars, how many per star) beside the reviews, and a
 * "Write a review" button that opens the form. Only approved reviews are passed in.
 */
export function ReviewsSection({
  productId,
  reviews,
}: {
  productId: string;
  reviews: Review[];
}) {
  const [writing, setWriting] = useState(false);
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const per = [5, 4, 3, 2, 1].map((n) => ({
    n,
    c: reviews.filter((r) => r.rating === n).length,
  }));

  const writeButton = (
    <button
      type="button"
      onClick={() => setWriting((w) => !w)}
      className={writing ? "btn-outline" : "btn-primary"}
      aria-expanded={writing}
      aria-controls="review-form"
    >
      {writing ? (
        <X size={15} aria-hidden />
      ) : (
        <PenLine size={15} strokeWidth={1.5} aria-hidden />
      )}{" "}
      {writing ? "Close" : "Write a review"}
    </button>
  );

  return (
    <section
      id="reviews"
      className="container-x scroll-mt-28 border-t border-sand py-16 md:py-20"
    >
      {/* Same centred heading as the other sections of the shop */}
      <SectionHeading eyebrow="Reviews" title="What customers say" />

      {/* Always on the page (hidden until "Write a review"), so what was typed survives closing it */}
      <div
        id="review-form"
        hidden={!writing}
        className="mx-auto mb-12 max-w-3xl border border-sand bg-white/70 p-6 backdrop-blur-sm md:p-8"
      >
        <div>
          <p className="font-display text-2xl">Share your thoughts</p>
          <p className="mt-1 mb-6 text-sm text-muted">
            Your review appears once the boutique has checked it.
          </p>
          <ReviewForm productId={productId} />
        </div>
      </div>

      {count === 0 ? (
        !writing && (
          <div className="mx-auto max-w-md text-center">
            <Stars value={0} size={22} />
            <p className="mt-4 text-muted">
              No reviews yet. Be the first to tell others what you think of this
              piece.
            </p>
            <div className="mt-6 flex justify-center">{writeButton}</div>
          </div>
        )
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
          {/* Summary */}
          <aside className="h-fit lg:sticky lg:top-32">
            <p className="font-display text-6xl leading-none">
              {average.toFixed(1)}
            </p>
            <div className="mt-3">
              <Stars value={average} size={18} />
            </div>
            <p className="mt-2 text-sm text-muted">
              Based on {count} review{count === 1 ? "" : "s"}
            </p>
            <ul className="mt-6 space-y-2" aria-label="Ratings">
              {per.map(({ n, c }) => (
                <li
                  key={n}
                  className="flex items-center gap-3 text-xs text-muted"
                >
                  <span className="w-3 text-right">{n}</span>
                  <span className="h-1.5 flex-1 overflow-hidden bg-sand">
                    <span
                      className="block h-full bg-gold"
                      style={{ width: `${count ? (c / count) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="w-5 text-right">{c}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 [&>button]:w-full">{writeButton}</div>
          </aside>

          {/* Reviews */}
          <ul className="grid items-start gap-5 md:grid-cols-2">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="flex flex-col border border-sand bg-white/70 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <Stars value={r.rating} />
                  <span className="text-xs text-muted">
                    {dateFmt(r.created_at)}
                  </span>
                </div>
                {r.title && (
                  <p className="mt-4 font-display text-xl leading-snug">
                    {r.title}
                  </p>
                )}
                <p
                  className={`${r.title ? "mt-2" : "mt-4"} flex-1 text-sm leading-relaxed whitespace-pre-line text-ink/85`}
                >
                  {r.body}
                </p>
                <p className="mt-5 flex items-center gap-2 text-[11px] tracking-[0.16em] text-muted uppercase">
                  <span
                    aria-hidden
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-cream font-display text-sm text-maroon normal-case"
                  >
                    {r.name.trim()[0]?.toUpperCase()}
                  </span>
                  {r.name}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
