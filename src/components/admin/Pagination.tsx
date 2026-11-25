import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** "1–25 of 48" + previous / next, keeping the page's other filters in the URL. */
export function Pagination({
  basePath,
  params,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const href = (p: number) => {
    const q = new URLSearchParams(
      Object.entries({ ...params, page: p > 1 ? String(p) : undefined }).filter((e): e is [string, string] => !!e[1]),
    );
    return q.size ? `${basePath}?${q}` : basePath;
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn = "chip !min-w-0 gap-1 !px-3 !py-2 !text-[12px]";

  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={btn} rel="prev">
            <ChevronLeft size={14} strokeWidth={1.5} aria-hidden /> Previous
          </Link>
        ) : (
          <span className={`${btn} opacity-40`} aria-disabled>
            <ChevronLeft size={14} strokeWidth={1.5} aria-hidden /> Previous
          </span>
        )}
        <span className="self-center px-1 text-muted">
          Page {page} of {pages}
        </span>
        {page < pages ? (
          <Link href={href(page + 1)} className={btn} rel="next">
            Next <ChevronRight size={14} strokeWidth={1.5} aria-hidden />
          </Link>
        ) : (
          <span className={`${btn} opacity-40`} aria-disabled>
            Next <ChevronRight size={14} strokeWidth={1.5} aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
