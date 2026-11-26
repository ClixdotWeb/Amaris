/** Print pages (labels, job cards): no dashboard frame, white page, sized for A4. */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white p-6 text-ink print:p-0">{children}</div>;
}
