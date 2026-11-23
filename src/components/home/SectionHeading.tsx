import { WordReveal } from "@/components/ui/WordReveal";

export function SectionHeading({ eyebrow, title, tagline }: { eyebrow?: string; title: string; tagline?: string }) {
  return (
    <div data-reveal className="mb-10 text-center md:mb-12">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="section-title">
        <WordReveal text={title} />
      </h2>
      <div className="mx-auto mt-4 flex items-center justify-center gap-3 text-gold" aria-hidden>
        <span className="h-px w-10 bg-gold/60" />
        <span className="text-xs">✦</span>
        <span className="h-px w-10 bg-gold/60" />
      </div>
      {tagline && <p className="mx-auto mt-4 max-w-xl text-sm text-muted">{tagline}</p>}
    </div>
  );
}
