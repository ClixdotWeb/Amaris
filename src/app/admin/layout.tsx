import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin", robots: { index: false } };

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/settings", label: "Settings" },
];

// In preview mode (no database) middleware rewrites /admin/* to /admin-preview, so this never renders there.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <nav aria-label="Admin" className="bg-maroon-dark p-5 text-ivory md:min-h-screen">
        <p className="font-display text-2xl tracking-[0.25em]">AMARIS</p>
        <p className="text-[10px] tracking-[0.3em] text-gold-light uppercase">Admin</p>
        <ul className="mt-8 flex gap-1 overflow-x-auto md:flex-col">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block px-3 py-2 text-sm whitespace-nowrap text-ivory/80 hover:bg-white/10 hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/" className="block px-3 py-2 text-sm whitespace-nowrap text-gold-light hover:text-white">View store →</Link>
          </li>
        </ul>
      </nav>
      <main className="min-w-0 space-y-6 p-5 md:p-10 admin-area [&_h1]:font-display [&_h1]:text-3xl">{children}</main>
    </div>
  );
}
