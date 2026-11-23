import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "My orders" },
  { href: "/account/addresses", label: "Addresses" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/account");
  return (
    <>
      <PageHeader title="My Account" />
      <div className="container-x grid gap-10 py-12 md:grid-cols-[220px_1fr]">
        <nav aria-label="My account">
          <ul className="flex gap-2 overflow-x-auto md:flex-col md:gap-0 md:border-l md:border-sand">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block px-4 py-2.5 text-sm whitespace-nowrap hover:text-maroon md:-ml-px md:border-l md:border-transparent md:hover:border-maroon">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <form method="post" action="/auth/signout">
                <button type="submit" className="px-4 py-2.5 text-sm text-muted hover:text-sale">Log out</button>
              </form>
            </li>
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
