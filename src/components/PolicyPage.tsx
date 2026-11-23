import { PageHeader } from "@/components/layout/PageHeader";

/** Wrapper for policy pages. Paste the client's exact wording (from WEBSITE_DESIGN_AMARIS.xlsx) into each page. */
export function PolicyPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <PageHeader title={title} subtitle={`Last updated: ${updated}`} />
      <article className="container-x py-14">
        <div data-reveal-stagger className="prose-amaris mx-auto">{children}</div>
      </article>
    </>
  );
}
