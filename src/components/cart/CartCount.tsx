"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";

export function CartCount({ className = "" }: { className?: string }) {
  const { count, ready } = useCart();
  return (
    <Link href="/cart" aria-label={`Cart, ${count} items`} className={`relative ${className}`}>
      <ShoppingBag size={19} strokeWidth={1.4} />
      {ready && count > 0 && (
        <span className="absolute top-0.5 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[9px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
