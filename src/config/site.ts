/** Business details. Single source of truth for header, footer, contact page, invoices and emails. */
export const site = {
  name: "Amaris Boutique",
  sisterBrands: ["Marias Bridal Works", "Marias Tailors"],
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  gstin: "32AUNPJ2752K1ZH",
  address: {
    lines: [
      "Pamplaniyil Arcade, Ground Floor",
      "Beside Marias Beauty Parlour",
      "Paika–Pinnakinadu Road, Paika Central Junction",
    ],
    state: "Kerala",
    country: "India",
  },
  phones: ["+91 8547572576", "+91 8089893300"],
  whatsapp: ["918547572576", "918089893300"], // wa.me format (no + or spaces)
  emails: ["amarisbymarias@gmail.com", "amarisboutique@zohomail.in"],
  instagram: [
    { handle: "amaris_boutique_paika", url: "https://instagram.com/amaris_boutique_paika" },
    { handle: "marias_bridal_works", url: "https://instagram.com/marias_bridal_works" },
    { handle: "mariastailors_paika", url: "https://instagram.com/mariastailors_paika" },
  ],
  hours: "Mon–Sat, 10:00 AM – 5:00 PM IST",
  // TODO: replace with the real Google Maps embed URL for the shop
  mapEmbedUrl: "",
  footerLine: "Amaris Boutique © 2026 All Rights Reserved",
} as const;

export const whatsappLink = (number: string = site.whatsapp[0], text?: string) =>
  `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
