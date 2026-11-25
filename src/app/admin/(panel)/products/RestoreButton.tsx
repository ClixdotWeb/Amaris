"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { bulkProducts } from "./actions";
import { useToast } from "@/components/admin/Toaster";

/** Restore one deleted product (it comes back hidden). */
export function RestoreButton({ id, size = "sm" }: { id: string; size?: "sm" | "xs" }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await bulkProducts([id], { kind: "restore" });
          if (r.error) toast(r.error, "error");
          else {
            toast("Restored. It's hidden until you set it Live.");
            router.refresh();
          }
        })
      }
      className={size === "xs" ? "inline-flex items-center gap-1 text-[11px] tracking-[0.14em] text-maroon uppercase hover:underline" : "btn-primary btn-sm"}
    >
      <RotateCcw size={13} strokeWidth={1.5} aria-hidden /> {pending ? "Restoring…" : "Restore"}
    </button>
  );
}
