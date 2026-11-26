import { ArrowDown, ArrowUp } from "lucide-react";

/** Up / down buttons that reorder a row through bound server actions (works without JavaScript). */
export function MoveButtons({
  up,
  down,
  isFirst,
  isLast,
  label,
}: {
  up: () => Promise<void>;
  down: () => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
  label: string;
}) {
  const btn = "flex h-8 w-8 items-center justify-center rounded-full border border-sand text-muted transition-colors hover:border-maroon hover:text-maroon disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="flex gap-1">
      <form action={up}>
        <button type="submit" className={btn} disabled={isFirst} aria-label={`Move ${label} up`}>
          <ArrowUp size={14} strokeWidth={1.6} />
        </button>
      </form>
      <form action={down}>
        <button type="submit" className={btn} disabled={isLast} aria-label={`Move ${label} down`}>
          <ArrowDown size={14} strokeWidth={1.6} />
        </button>
      </form>
    </div>
  );
}
