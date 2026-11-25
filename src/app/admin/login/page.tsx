import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/guard";
import { Logo } from "@/components/layout/Logo";
import { Lotus } from "@/components/ui/Lotus";
import { cloudImage, PHOTO_WIDE } from "@/lib/images";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin sign in", robots: { index: false } };

/** Split screen: the boutique's campaign photo (same as the shop's hero) beside the sign-in card. */
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getAdmin()) redirect(next?.startsWith("/admin") ? next : "/admin");

  return (
    <main className="admin-area grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-maroon-dark lg:block">
        <img
          src={cloudImage("/Assets/hero/hero-saree-red-banarasi.jpg", PHOTO_WIDE)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[60%_50%]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-maroon-dark/90 via-maroon-dark/30 to-transparent" />
        <div className="absolute inset-x-12 bottom-12 text-ivory">
          <Lotus width={26} height={18} className="text-gold-light" />
          <p className="mt-4 max-w-md font-display text-4xl leading-tight">Handpicked in Kerala, stitched to every measure.</p>
          <p className="mt-3 text-[11px] tracking-[0.3em] text-gold-light/80 uppercase">Amaris Boutique · Admin</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center">
            <Logo className="h-20 w-auto" />
            <span aria-hidden className="mt-6 flex items-center gap-3 text-gold">
              <span className="h-px w-10 bg-gold/40" />
              <Lotus width={18} height={12} />
              <span className="h-px w-10 bg-gold/40" />
            </span>
            <h1 className="mt-5 font-display text-4xl">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted">Sign in to manage the boutique.</p>
          </div>
          <div className="card mt-8 rounded-card p-7 shadow-lift">
            <LoginForm next={next} />
          </div>
          <p className="mt-6 text-center text-xs text-muted">For Amaris Boutique staff only.</p>
        </div>
      </div>
    </main>
  );
}
