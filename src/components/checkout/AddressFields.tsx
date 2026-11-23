"use client";
import type { ShippingAddress } from "@/types";

/** Indian states + UTs for the state dropdown (domestic). */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

export function AddressFields({
  value,
  onChange,
  countries,
  errors = {},
}: {
  value: ShippingAddress;
  onChange: (a: ShippingAddress) => void;
  /** Country codes the shop ships to besides India (from settings.international_rates). */
  countries: string[];
  errors?: Partial<Record<keyof ShippingAddress, string>>;
}) {
  const set = (k: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [k]: e.target.value });
  const domestic = value.country === "IN";

  const field = (k: keyof ShippingAddress, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, span = 2) => (
    <label className={span === 2 ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      <input value={(value[k] as string) ?? ""} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <span role="alert" className="mt-1 block text-xs text-sale">{errors[k]}</span>}
    </label>
  );

  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">Shipping address</legend>
      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-xs text-muted">Country</span>
        <select value={value.country} onChange={set("country")}>
          <option value="IN">India</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {new Intl.DisplayNames(["en"], { type: "region" }).of(c) ?? c}
            </option>
          ))}
        </select>
      </label>
      {field("full_name", "Full name", { required: true, autoComplete: "name" }, 1)}
      {field("phone", domestic ? "Mobile number (10 digits)" : "Phone (with country code)", { required: true, type: "tel", autoComplete: "tel" }, 1)}
      {field("line1", "House / building, street", { required: true, autoComplete: "address-line1" })}
      {field("line2", "Area, landmark (optional)", { autoComplete: "address-line2" })}
      {field("city", "City / town", { required: true, autoComplete: "address-level2" }, 1)}
      {domestic ? (
        <label>
          <span className="mb-1.5 block text-xs text-muted">State</span>
          <select value={value.state} onChange={set("state")} required>
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      ) : (
        field("state", "State / province / region", { required: true }, 1)
      )}
      {field(
        "pincode",
        domestic ? "PIN code" : "Postal code",
        { required: true, inputMode: domestic ? "numeric" : "text", maxLength: domestic ? 6 : 12, autoComplete: "postal-code" },
        1,
      )}
    </fieldset>
  );
}
