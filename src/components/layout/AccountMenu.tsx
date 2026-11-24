"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, X, ArrowRight } from "lucide-react";
import { AuthForm } from "@/app/(shop)/(auth)/AuthForm";
import { login } from "@/app/(shop)/(auth)/actions";

const accountLinks = [
  { href: "/account", label: "My account" },
  { href: "/account/orders", label: "My orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/track-order", label: "Track order" },
];

/**
 * Profile icon → small popover under the icon (no page change).
 * Signed out: quick log-in form + links to sign up / reset password. Signed in: account shortcuts + log out.
 * Closes on outside click, Escape or navigation.
 */
export function AccountMenu({ email, preview, className = "" }: { email: string | null; preview: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="My account"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((o) => !o)}
        className={className}
      >
        <User size={19} strokeWidth={1.4} />
      </button>

      <div
        id="account-menu"
        role="dialog"
        aria-label="My account"
        className={`absolute top-full right-0 z-50 mt-3 w-[320px] max-w-[calc(100vw-2rem)] origin-top-right rounded-[3px] border border-sand bg-ivory text-left text-ink shadow-[0_24px_48px_-24px_rgba(43,42,44,0.35)] transition-[opacity,transform,visibility] duration-200 ease-out ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute top-3 right-3 p-1 text-muted transition-colors hover:text-maroon">
          <X size={16} strokeWidth={1.4} />
        </button>

        <div className="px-6 pt-6 pb-5 text-center">
          <p className="text-[10px] tracking-[0.3em] text-gold uppercase">My account</p>
          <h2 className="mt-2 font-display text-3xl">{email ? "Hello again" : "Welcome"}</h2>
          <span aria-hidden className="mx-auto mt-3 block h-px w-8 bg-gold/60" />
          <p className="mt-3 text-xs text-muted">{email ? <>Signed in as <span className="text-ink">{email}</span></> : "Log in to track orders and check out faster."}</p>
        </div>

        {email ? (
          <>
            <ul className="border-t border-sand py-2">
              {accountLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group/item flex items-center justify-between px-6 py-2.5 text-[11px] tracking-[0.18em] uppercase transition-colors hover:bg-cream hover:text-maroon"
                  >
                    {l.label}
                    <ArrowRight size={13} strokeWidth={1.5} className="-translate-x-1 opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
            <form method="post" action="/auth/signout" className="border-t border-sand px-6 py-4">
              <button type="submit" className="text-[11px] tracking-[0.18em] text-muted uppercase transition-colors hover:text-sale">
                Log out
              </button>
            </form>
          </>
        ) : (
          <div className="border-t border-sand px-6 pt-5 pb-6">
            {preview && <p className="mb-4 bg-gold-light/40 p-2.5 text-[11px] leading-relaxed">Preview mode: login works once the database is connected.</p>}
            <AuthForm
              action={login}
              next={path}
              submitLabel="Log in"
              fields={[
                { name: "email", label: "Email", type: "email", autoComplete: "email" },
                { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
              ]}
            />
            <div className="mt-4 flex justify-between text-xs">
              <Link href="/forgot-password" className="text-muted transition-colors hover:text-maroon">Forgot password?</Link>
              <Link href="/signup" className="text-maroon underline underline-offset-4">Create an account</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
