import { Fragment } from "react";

/**
 * Splits text into words that rise one after another when the scroll-reveal observer marks an ancestor
 * (or the heading itself) with .is-revealed. Styles: globals.css ("Word-by-word headline reveal").
 * `startIndex` continues the stagger across several WordReveal pieces inside one heading.
 * Note: the space must sit *between* the masked word boxes. Inside an inline-block it would be dropped.
 */
export function WordReveal({ text, startIndex = 0 }: { text: string; startIndex?: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          <span className="wr-word" style={{ ["--wr-i" as string]: startIndex + i }}>
            <span>{w}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
