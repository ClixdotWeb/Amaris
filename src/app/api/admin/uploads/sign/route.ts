import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/guard";
import { rateLimit } from "@/lib/admin/rateLimit";
import { uploadSignature, uploadsConfigured } from "@/lib/admin/cloudinary";

/** Signed parameters for one browser → Cloudinary photo upload. Admins only. */
export async function POST() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!uploadsConfigured()) return NextResponse.json({ error: "Cloudinary keys are missing in .env.local." }, { status: 503 });
  const limited = rateLimit(`upload-sign:${admin.email}`, 120, 60);
  if (!limited.ok) return NextResponse.json({ error: "Too many uploads. Wait a minute." }, { status: 429 });
  return NextResponse.json(uploadSignature(), { headers: { "Cache-Control": "no-store" } });
}
