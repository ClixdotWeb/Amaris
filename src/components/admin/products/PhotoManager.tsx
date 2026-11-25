"use client";
import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, GripVertical, Star } from "lucide-react";
import { Badge } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toaster";
import type { ProductImage } from "@/types";

/**
 * Product photos: drag to reorder (or use the arrows / "Make main" buttons with the keyboard). The first photo is the main one.
 * Saves the new order right away. Each photo's remove button is passed in (a server-rendered confirm button).
 */
export function PhotoManager({
  images,
  save,
  removeButtons,
}: {
  images: Pick<ProductImage, "id" | "url" | "thumb_url" | "alt">[];
  save: (ids: string[]) => Promise<{ ok?: boolean | string; error?: string }>;
  removeButtons: Record<string, React.ReactNode>;
}) {
  const [order, setOrder] = useState(images.map((i) => i.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const byId = new Map(images.map((i) => [i.id, i]));

  const commit = (next: string[]) => {
    const prev = order;
    setOrder(next);
    start(async () => {
      const r = await save(next);
      if (r.error) {
        setOrder(prev);
        toast(r.error, "error");
      } else toast(typeof r.ok === "string" ? r.ok : "Photo order saved.");
    });
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    commit(next);
  };

  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8" aria-busy={pending}>
      {order.map((id, i) => {
        const img = byId.get(id);
        if (!img) return null;
        return (
          <li
            key={id}
            draggable
            onDragStart={(e) => {
              setDragging(id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging) move(order.indexOf(dragging), i);
              setDragging(null);
            }}
            className={`group relative transition-opacity ${dragging === id ? "opacity-40" : ""}`}
          >
            <img src={img.thumb_url ?? img.url} alt={img.alt ?? `Photo ${i + 1}`} className="aspect-[3/4] w-full cursor-grab rounded-media border border-sand bg-cream object-cover active:cursor-grabbing" />
            <span aria-hidden className="absolute top-1.5 left-1.5 rounded-full bg-white/90 p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical size={13} strokeWidth={1.5} />
            </span>
            <span className="absolute top-1.5 right-1.5">{removeButtons[id]}</span>
            <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1">
              {i === 0 ? (
                <Badge tone="gold">Main</Badge>
              ) : (
                <button
                  type="button"
                  onClick={() => move(i, 0)}
                  disabled={pending}
                  aria-label={`Make photo ${i + 1} the main photo`}
                  title="Make main photo"
                  className="rounded-full bg-white/95 p-1.5 shadow-sm hover:text-maroon"
                >
                  <Star size={13} strokeWidth={1.5} />
                </button>
              )}
              <span className="flex gap-0.5">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0 || pending} aria-label={`Move photo ${i + 1} left`} className="rounded-full bg-white/95 p-1 shadow-sm hover:text-maroon disabled:opacity-0">
                  <ChevronLeft size={13} strokeWidth={1.5} />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === order.length - 1 || pending} aria-label={`Move photo ${i + 1} right`} className="rounded-full bg-white/95 p-1 shadow-sm hover:text-maroon disabled:opacity-0">
                  <ChevronRight size={13} strokeWidth={1.5} />
                </button>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
