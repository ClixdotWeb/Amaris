import Link from "next/link";
import { Search } from "lucide-react";
import { headerNav, isGroup } from "@/config/navigation";
import { categoryPhoto } from "@/lib/data/mock";
import { CartCount } from "@/components/cart/CartCount";
import { getUser } from "@/lib/auth";
import { USE_MOCK } from "@/lib/data/mode";
import { AccountMenu } from "./AccountMenu";
import { HeaderShell } from "./HeaderShell";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";

/** Thumbnails for the mega menu and drawer, keyed by category slug (product photos; see mock.ts CAT). */
const navImages: Record<string, string | undefined> = Object.fromEntries(
  headerNav
    .filter(isGroup)
    .flatMap((g) => g.children)
    .map((c) => [c.slug, categoryPhoto(c.slug, 400)]),
);

const iconLink = "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 hover:bg-cream hover:text-maroon";

/**
 * One-row header: logo left · categories centred · icons right.
 * Slims down on scroll (HeaderShell sets data-scrolled). The mega menu anchors to this header's bottom edge.
 */
export async function Header() {
  const user = await getUser();

  return (
    <HeaderShell>
      <div className="container-x flex h-[72px] items-center transition-[height] duration-500 lg:h-[88px] lg:group-data-[scrolled=true]/header:h-[72px]">
        {/* Left: menu (mobile) + logo */}
        <div className="flex flex-1 items-center gap-2">
          <MobileMenu nav={headerNav} images={navImages} />
          <Logo swap className="h-[50px] transition-[height] duration-500 lg:h-[62px] lg:group-data-[scrolled=true]/header:h-[50px]" />
        </div>

        {/* Centre: categories */}
        <nav aria-label="Main" className="hidden h-full lg:block">
          <NavLinks items={headerNav} images={navImages} />
        </nav>

        {/* Right: icons */}
        <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
          <Link href="/search" aria-label="Search" className={iconLink}>
            <Search size={19} strokeWidth={1.4} />
          </Link>
          <div className="hidden sm:block">
            <AccountMenu email={user?.email ?? null} preview={USE_MOCK} className={iconLink} />
          </div>
          <CartCount className={iconLink} />
        </div>
      </div>
    </HeaderShell>
  );
}
