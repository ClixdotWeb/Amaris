const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** 129900 (paise) → "₹1,299" */
export const formatINR = (paise: number) => inr.format(paise / 100);

/** ₹ → paise, for admin form inputs */
export const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
