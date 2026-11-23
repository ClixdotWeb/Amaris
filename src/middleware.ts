import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { USE_MOCK } from "@/lib/data/mode";

export async function middleware(request: NextRequest) {
  if (USE_MOCK) {
    // Preview mode: no auth backend. Admin needs the database, so show a notice instead.
    const path = request.nextUrl.pathname;
    if (path === "/admin" || path.startsWith("/admin/"))
      return NextResponse.rewrite(new URL("/admin-preview", request.url));
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  // Skip static files, images and the Razorpay webhook (it has no session and needs the raw body).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
