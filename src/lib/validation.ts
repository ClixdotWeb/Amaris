import { z } from "zod";
import { MEASUREMENT_FIELDS } from "@/config/shop";

const measurementsSchema = z
  .record(z.string(), z.number().positive().max(200))
  .refine(
    (m) => MEASUREMENT_FIELDS.filter((f) => f.required).every((f) => typeof m[f.key] === "number"),
    { message: "Please fill in all required measurements" },
  );

export const sizingSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("standard"), size: z.string().min(1) }),
  z.object({
    mode: z.literal("custom"),
    measurements: measurementsSchema,
    notes: z.string().max(500).optional(),
  }),
]);

/** What the browser sends for each cart line. Prices are NOT accepted from the client. */
export const cartLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  size: z.string().optional(), // ready made
  colour: z.string().max(80).optional(), // products with colour options
  lengthMetres: z.number().positive().max(100).optional(), // running material
  stitching: z.boolean().optional(), // unstitched
  sizing: sizingSchema.optional(), // unstitched + stitching, or custom made
});

export const pincodeSchema = z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code");
export const indianPhoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

export const addressSchema = z
  .object({
    full_name: z.string().min(2),
    phone: z.string().min(7),
    line1: z.string().min(3),
    line2: z.string().optional().nullable(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(3),
    country: z.string().length(2).default("IN"),
  })
  .superRefine((a, ctx) => {
    if (a.country !== "IN") return;
    if (!pincodeSchema.safeParse(a.pincode).success)
      ctx.addIssue({ code: "custom", path: ["pincode"], message: "Enter a valid 6-digit PIN code" });
    if (!indianPhoneSchema.safeParse(a.phone).success)
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid 10-digit mobile number" });
  });

export const checkoutSchema = z.object({
  items: z.array(cartLineSchema).min(1),
  address: addressSchema,
  email: z.string().email(),
  customerNotes: z.string().max(1000).optional(),
  // Brief §8: must tick the policy box. §6: must confirm address / PIN / phone.
  acceptedPolicies: z.literal(true),
  confirmedAddress: z.literal(true),
  saveAddress: z.boolean().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CartLineInput = z.infer<typeof cartLineSchema>;
