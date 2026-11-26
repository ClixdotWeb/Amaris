"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveCoupon } from "./actions";
import { Field } from "@/components/admin/ui";
import { FormSwitch, InstantSwitch } from "@/components/admin/Switch";
import { Select } from "@/components/admin/Select";
import { useActionToast } from "@/components/admin/Toaster";
import { setCouponActive } from "./actions";
import type { Coupon } from "@/types";

const rupees = (p: number | null | undefined) => (p == null ? "" : String(p / 100));
const day = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 330 * 60_000).toISOString().slice(0, 10) : "");

/** Create or edit a coupon. Amounts are typed in rupees. */
export function CouponForm({ coupon }: { coupon: Coupon | null }) {
  const [state, action, pending] = useActionState(saveCoupon, undefined);
  useActionToast(state);
  const [type, setType] = useState<Coupon["type"]>(coupon?.type ?? "percent");
  const money = { type: "number", min: 0, step: "1", inputMode: "decimal" as const };
  return (
    <form action={action} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <Field label="Code" htmlFor="cp-code" hint="What customers type, e.g. ONAM10.">
        <input id="cp-code" name="code" required maxLength={20} defaultValue={coupon?.code} className="font-mono uppercase" aria-describedby="cp-code-hint" />
      </Field>
      <Field label="Discount type" htmlFor="cp-type">
        <Select id="cp-type" name="type" label="Discount type" value={type} onChange={(v) => setType(v as Coupon["type"])} options={[{ value: "percent", label: "Percentage off" }, { value: "flat", label: "Amount off (₹)" }]} />
      </Field>
      <Field label={type === "percent" ? "Discount (%)" : "Discount (₹)"} htmlFor="cp-value">
        <input id="cp-value" name="value" required {...money} max={type === "percent" ? 90 : undefined} defaultValue={coupon ? (coupon.type === "percent" ? coupon.value : coupon.value / 100) : ""} />
      </Field>
      <Field label="Largest discount (₹)" htmlFor="cp-max" hint={type === "percent" ? "Optional cap for percentage coupons." : "Only for percentage coupons."}>
        <input id="cp-max" name="max_discount" {...money} disabled={type !== "percent"} defaultValue={rupees(coupon?.max_discount)} aria-describedby="cp-max-hint" />
      </Field>
      <Field label="Minimum order (₹)" htmlFor="cp-min" hint="Items total, before shipping.">
        <input id="cp-min" name="min_order" {...money} defaultValue={coupon?.min_order ? coupon.min_order / 100 : ""} aria-describedby="cp-min-hint" />
      </Field>
      <Field label="Starts" htmlFor="cp-start" hint="Optional.">
        <input id="cp-start" name="starts" type="date" defaultValue={day(coupon?.starts_at ?? null)} aria-describedby="cp-start-hint" />
      </Field>
      <Field label="Ends" htmlFor="cp-end" hint="Optional. Ends at midnight (IST).">
        <input id="cp-end" name="ends" type="date" defaultValue={day(coupon?.ends_at ?? null)} aria-describedby="cp-end-hint" />
      </Field>
      <Field label="Total uses allowed" htmlFor="cp-limit" hint="Optional. Empty for no limit.">
        <input id="cp-limit" name="usage_limit" type="number" min={1} step={1} defaultValue={coupon?.usage_limit ?? ""} aria-describedby="cp-limit-hint" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Note (only for you)" htmlFor="cp-desc">
          <input id="cp-desc" name="description" maxLength={120} defaultValue={coupon?.description ?? ""} placeholder="e.g. Onam 2026 Instagram offer" />
        </Field>
      </div>
      <FormSwitch name="is_active" defaultChecked={coupon?.is_active ?? true} label="Coupon is on" />
      <div className="flex items-end justify-end gap-2">
        <Link href="/admin/coupons" className="btn-outline btn-sm">Cancel</Link>
        <button type="submit" className="btn-primary btn-sm whitespace-nowrap" disabled={pending}>
          {pending ? "Saving…" : coupon ? "Save coupon" : "Create coupon"}
        </button>
      </div>
    </form>
  );
}

export function CouponSwitch({ id, code, active }: { id: string; code: string; active: boolean }) {
  return <InstantSwitch checked={active} label={`${code} on`} save={(next) => setCouponActive(id, next)} onMessage={`${code} is on.`} offMessage={`${code} is off.`} />;
}
