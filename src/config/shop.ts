/**
 * Shop rules that are fixed by the brief. Values the client still has to confirm
 * (stitching charge, shipping fees, COD) live in the `settings` table instead,
 * so the admin can change them without a deploy. See src/lib/data/settings.ts.
 */

export const DISPATCH = {
  in_stock: { label: "Dispatched within 48 hours", short: "48 hours" },
  made_to_order: { label: "Dispatched in 45–60 days (made to order)", short: "45–60 days" },
} as const;

export const DELIVERY_AFTER_DISPATCH = {
  kerala: "5 working days",
  restOfIndia: "8 working days",
  international: "Varies by country",
} as const;

export const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

/**
 * Women's size chart (inches), from the client. Shown on the product page wherever a size is chosen
 * for stitching (unstitched suits with stitching, frocks & kurtis). Not shown for kids.
 * NOTE: L and XL look swapped in the client's chart (L is bigger than XL) — confirm with the client.
 */
export const SIZE_CHART = {
  unit: "inches",
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  rows: [
    { label: "Chest", values: ["32", "34", "36", "41", "40", "43"] },
    { label: "Waist", values: ["29", "31", "32", "37", "36", "41"] },
    { label: "Hip", values: ["33", "35", "37", "43", "42", "46"] },
    { label: "Shoulder", values: ["14½", "15", "15½", "16¼", "16", "16¾"] },
    { label: "Sleeve length", values: ["16", "16", "16", "16", "16", "16"] },
    { label: "Length", values: ["48", "48", "48", "48", "48", "48"] },
  ],
  note: "Our sizes are flexible — every size can be altered to the next or previous size in the size chart.",
} as const;

/** Kids sizes (by age). TODO: confirm with the client's size chart. */
export const KIDS_SIZES = ["1-2Y", "2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y", "9-10Y"] as const;

/**
 * Manual measurement fields, in inches.
 * TODO: replace with the client's final list (brief §9).
 */
export const MEASUREMENT_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: "bust", label: "Bust", required: true },
  { key: "waist", label: "Waist", required: true },
  { key: "hip", label: "Hip", required: true },
  { key: "shoulder", label: "Shoulder", required: true },
  { key: "top_length", label: "Top length", required: true },
  { key: "sleeve_length", label: "Sleeve length", required: true },
  { key: "armhole", label: "Armhole", required: false },
  { key: "front_neck_depth", label: "Front neck depth", required: false },
  { key: "back_neck_depth", label: "Back neck depth", required: false },
  { key: "bottom_length", label: "Bottom length", required: false },
];

export const MEASUREMENT_UNIT = "inches";

export const STITCHING_NOTE =
  "Items are stitched strictly to the measurements you provide. Alterations cost extra (stitching + shipping).";

export const CUSTOMS_NOTE =
  "International orders: customs / import duties and taxes are paid by the customer.";

/** India Post tracking: the "Consignment / Money Order Number" box on the India Post home page (old .aspx tracking URL no longer works). */
export const INDIA_POST_TRACKING_URL = "https://www.indiapost.gov.in/#home-banner";
