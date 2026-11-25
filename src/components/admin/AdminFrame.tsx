"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, ChevronsLeft, LogOut, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { NavProgress } from "@/components/layout/NavProgress";
import { Lotus } from "@/components/ui/Lotus";
import { sectionTitle, type AdminNavCounts } from "./nav";
import { SidebarNav } from "./SidebarNav";

const COLLAPSE_KEY = "amaris-admin-sidebar";

/**
 * Admin layout: a burgundy sidebar with the shop's damask texture and the lotus mark (like the site's
 * banners and footer), and a light sticky top bar (like the site header).
 * Desktop: the sidebar can collapse to icons (remembered in this browser). Below lg it is a drawer.
 */
export function AdminFrame({
  admin,
  counts,
  logout,
  children,
}: {
  admin: { email: string; name: string };
  counts: AdminNavCounts;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  // Remembered per browser; a convenience only, so failures are ignored
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {}
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // "/" focuses the search (unless typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || t.closest("input, textarea, select, [contenteditable=true]")) return;
      if (!searchInput.current || searchInput.current.offsetParent === null) return;
      e.preventDefault();
      searchInput.current.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initial = (admin.name || admin.email)[0]?.toUpperCase();

  const sidebar = (compact: boolean, drawer: boolean) => (
    <>
      <div className={`relative flex items-center py-5 ${compact ? "flex-col gap-3 px-2" : "justify-between px-5"}`}>
        <Logo light href="/admin" label="Amaris admin: overview" className={compact ? "h-9 w-auto" : "h-[52px] w-auto"} />
        {!drawer && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={compact}
            title={compact ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-full border border-white/15 p-1.5 text-ivory/60 transition-colors hover:border-gold-light/50 hover:text-gold-light"
          >
            <ChevronsLeft size={14} strokeWidth={1.5} className={`transition-transform duration-300 ${compact ? "rotate-180" : ""}`} />
          </button>
        )}
        {drawer && (
          <button type="button" className="p-1 text-ivory/80 hover:text-white" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={22} strokeWidth={1.5} />
          </button>
        )}
        <span aria-hidden className={`absolute bottom-0 h-px bg-gradient-to-r from-transparent via-gold-light/30 to-transparent ${compact ? "inset-x-2" : "inset-x-6"}`} />
      </div>
      <SidebarNav path={path} compact={compact} counts={counts} />
      <div className={`relative py-4 ${compact ? "px-3" : "px-3.5"}`}>
        <span aria-hidden className={`absolute top-0 h-px bg-gradient-to-r from-transparent via-gold-light/30 to-transparent ${compact ? "inset-x-2" : "inset-x-6"}`} />
        {compact ? (
          <div className="flex flex-col items-center gap-3">
            <span aria-hidden title={admin.name} className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-light/40 font-display text-lg text-gold-light">
              {initial}
            </span>
            <Link href="/" target="_blank" title="View store" className="p-1 text-ivory/60 hover:text-gold-light">
              <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden />
              <span className="sr-only">View store</span>
            </Link>
            <form action={logout}>
              <button type="submit" title="Sign out" className="p-1 text-ivory/60 hover:text-gold-light">
                <LogOut size={16} strokeWidth={1.5} aria-hidden />
                <span className="sr-only">Sign out</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[var(--radius-control)] bg-white/[0.05] p-3">
            <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-light/40 font-display text-xl text-gold-light">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ivory">{admin.name}</span>
              <Link href="/" target="_blank" className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] text-gold-light/80 uppercase hover:text-gold-light">
                View store <ArrowUpRight size={11} strokeWidth={1.5} aria-hidden />
              </Link>
            </span>
            <form action={logout}>
              <button
                type="submit"
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ivory/60 transition-colors hover:bg-white/10 hover:text-gold-light"
              >
                <LogOut size={16} strokeWidth={1.5} aria-hidden />
                <span className="sr-only">Sign out</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      className={`admin-area min-h-screen lg:grid lg:transition-[grid-template-columns] lg:duration-300 ${
        collapsed ? "lg:grid-cols-[100px_1fr]" : "lg:grid-cols-[284px_1fr]"
      }`}
    >
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      {/* Desktop sidebar: a floating rounded panel, inset from the screen edges */}
      <div className="sticky top-0 hidden h-screen p-3 pr-0 lg:block">
        <aside className="relative flex h-full flex-col overflow-hidden rounded-[22px] bg-maroon-dark text-ivory shadow-[0_24px_48px_-24px_rgb(53_15_16/0.7)] ring-1 ring-white/5">
          {sidebar(collapsed, false)}
        </aside>
      </div>

      {/* Mobile / tablet drawer */}
      <div
        className={`fixed inset-0 z-[60] bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-[86%] max-w-[300px] flex-col bg-maroon-dark text-ivory shadow-xl transition-transform duration-300 ease-soft lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Admin menu"
        inert={!open}
      >
        {sidebar(false, true)}
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 border-b border-sand/60 bg-ivory/80 backdrop-blur-md">
          <NavProgress />
          <div className="flex h-[68px] items-center gap-3 px-4 md:px-8 lg:px-10">
            <button ref={menuButton} type="button" className="-ml-1 p-1 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
              <Menu size={24} strokeWidth={1.5} />
            </button>
            {/* Section breadcrumb; the page's own heading (h1) is in the content */}
            <p className="flex min-w-0 flex-1 items-center gap-2.5 truncate text-[11px] tracking-[0.24em] text-muted uppercase">
              <span className="hidden sm:inline">Amaris</span>
              <Lotus width={14} height={10} className="hidden shrink-0 text-gold sm:block" />
              <span className="text-ink">{sectionTitle(path)}</span>
            </p>
            <form action="/admin/search" role="search" className="relative hidden w-80 md:block">
              <label htmlFor="admin-search" className="sr-only">Search orders and products</label>
              <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                ref={searchInput}
                id="admin-search"
                name="q"
                type="search"
                placeholder="Search orders, customers, products…"
                aria-keyshortcuts="/"
                className="!rounded-full !border-sand !bg-white/70 !py-2.5 !pr-10 !pl-11 text-sm shadow-[inset_0_1px_2px_rgb(43_42_44/0.04)] focus:!bg-white"
              />
              <kbd aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 rounded-[4px] border border-sand bg-ivory px-1.5 text-[11px] text-muted">
                /
              </kbd>
            </form>
            <Link href="/admin/search" className="p-1 md:hidden" aria-label="Search">
              <Search size={20} strokeWidth={1.5} />
            </Link>
            <ProfileMenu admin={admin} logout={logout} initial={initial} />
          </div>
        </header>
        <main id="admin-main" className="admin-enter mx-auto w-full max-w-[1360px] min-w-0 flex-1 space-y-7 px-4 pt-8 pb-10 md:px-8 lg:px-10 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Admin name + sign out, in the same popover style as the storefront's account menu. */
function ProfileMenu({ admin, logout, initial }: { admin: { email: string; name: string }; logout: () => Promise<void>; initial?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const path = usePathname();
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
      <button type="button" aria-expanded={open} aria-controls="admin-profile" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-white/70">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon font-display text-lg text-white shadow-[0_4px_12px_-4px_rgb(110_31_42/0.6)]">
          {initial}
        </span>
        <span className="sr-only">Admin menu for {admin.email}</span>
        <ChevronDown size={14} strokeWidth={1.5} className="text-muted" aria-hidden />
      </button>
      <div
        id="admin-profile"
        className={`dropdown-panel absolute top-full right-0 z-50 mt-3 w-64 transition-[opacity,transform,visibility] duration-200 ease-out ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="px-4 pt-3 pb-3.5">
          <p className="text-[10px] tracking-[0.3em] text-muted uppercase">Signed in as</p>
          <p className="mt-1 truncate font-display text-xl">{admin.name}</p>
          <p className="truncate text-xs text-muted" title={admin.email}>{admin.email}</p>
        </div>
        <div className="space-y-0.5 border-t border-sand/70 pt-1.5">
          <a href="/" target="_blank" rel="noreferrer" className="dropdown-item">
            View store <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden className="text-muted" />
          </a>
          <form action={logout}>
            <button type="submit" className="dropdown-item hover:!text-sale">
              Sign out <LogOut size={15} strokeWidth={1.6} aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
