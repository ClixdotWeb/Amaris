"use client";
import { Printer } from "lucide-react";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary btn-sm print:hidden">
      <Printer size={15} strokeWidth={1.5} aria-hidden /> {label}
    </button>
  );
}
