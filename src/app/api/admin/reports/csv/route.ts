import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin/guard";
import { db } from "@/lib/db";
import { reportRange } from "@/lib/admin/reportRange";

/** CSV download of one report table (by day / product / category / size). Admins only. */
export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const p = req.nextUrl.searchParams;
  const r = reportRange({ range: p.get("range") ?? undefined, from: p.get("from") ?? undefined, to: p.get("to") ?? undefined });
  const kind = p.get("kind") ?? "days";
  const rep = await db.reports.sales(r.fromIso, r.toIso);
  const rupees = (paise: number) => (paise / 100).toFixed(2);
  // Quote every cell; a leading = + - @ is neutralised so spreadsheets don't run it as a formula
  const cell = (v: string | number) => {
    const s = String(v);
    return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  };
  let rows: (string | number)[][];
  if (kind === "products") rows = [["Product", "Quantity", "Revenue (INR)"], ...rep.byProduct.map((x) => [x.name, x.qty, rupees(x.revenue)])];
  else if (kind === "categories") rows = [["Category", "Items", "Revenue (INR)"], ...rep.byCategory.map((x) => [x.name, x.qty, rupees(x.revenue)])];
  else if (kind === "sizes") rows = [["Size", "Items"], ...rep.bySize.map((x) => [x.size, x.qty])];
  else rows = [["Date", "Orders", "Revenue (INR)"], ...rep.byDay.map((x) => [x.day, x.orders, rupees(x.revenue)])];
  const csv = rows.map((row) => row.map(cell).join(",")).join("\r\n");
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="amaris-${kind}-${r.fromDay}-to-${r.toDay}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
