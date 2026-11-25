import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

/**
 * Admin table. Desktop: a normal table. Below lg: each row becomes a card, each cell labelled with its column
 * (CSS in globals.css, .data-table; cards below 1024px). Server component: rows come from the page, filters and pages live in the URL.
 */
export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Right-align numbers and money. */
  align?: "left" | "right";
  className?: string;
  /** Shown in the header instead of the text (e.g. a select-all checkbox); header text stays the mobile label. */
  headerNode?: React.ReactNode;
  /** Sortable column: link that sorts by this column, and the current direction if it is the active sort. */
  sort?: { href: string; active: "asc" | "desc" | null };
};

function HeaderCell<T>({ c }: { c: Column<T> }) {
  if (c.headerNode) return <>{c.headerNode}</>;
  if (!c.sort) return <>{c.header}</>;
  const Icon = c.sort.active === "asc" ? ArrowUp : c.sort.active === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <Link href={c.sort.href} scroll={false} className={`inline-flex items-center gap-1.5 !text-current !no-underline hover:!text-ink ${c.sort.active ? "!text-ink" : ""}`}>
      {c.header}
      <Icon size={13} strokeWidth={1.5} aria-hidden className={c.sort.active ? "" : "opacity-50"} />
      <span className="sr-only">{c.sort.active ? `, sorted ${c.sort.active === "asc" ? "ascending" : "descending"}` : ", sort"}</span>
    </Link>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Read by screen readers. */
  caption: string;
  /** Shown instead of the table when there are no rows. */
  empty: React.ReactNode;
}) {
  if (rows.length === 0) return <>{empty}</>;
  return (
    <div className="overflow-x-auto lg:px-1">
      <table className="data-table table-amaris">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={c.align === "right" ? "text-right" : ""}
                aria-sort={c.sort?.active === "asc" ? "ascending" : c.sort?.active === "desc" ? "descending" : undefined}
              >
                <HeaderCell c={c} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)}>
              {columns.map((c) => (
                <td key={c.key} data-label={c.header} className={`${c.align === "right" ? "lg:text-right" : ""} ${c.className ?? ""}`}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
