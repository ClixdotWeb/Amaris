import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { USE_MOCK } from "@/lib/data/mode";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin/session";

const isAdminPath = (p: string) => p === "/admin" || p.startsWith("/admin/") || p.startsWith("/api/admin/");

/**
 * Admin area: needs a valid admin session (first check; every admin page, action and route checks again on the server).
 * Not cached, not indexed.
 */
async function adminGate(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const res =
    path === "/admin/login" || (await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value))
      ? NextResponse.next()
      : path.startsWith("/api/")
        ? NextResponse.json({ error: "Not signed in." }, { status: 401 })
        : NextResponse.redirect(new URL(`/admin/login?next=${encodeURIComponent(path)}`, request.url));
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export async function middleware(request: NextRequest) {
  if (isAdminPath(request.nextUrl.pathname)) return adminGate(request);
  if (USE_MOCK) return NextResponse.next(); // preview mode: no customer login backend
  return updateSession(request);
}

export const config = {
  // Skip static files, images and the Razorpay webhook (it has no session and needs the raw body).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
