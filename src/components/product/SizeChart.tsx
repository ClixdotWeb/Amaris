"use client";
import { useRef } from "react";
import type { SizeChartData } from "@/types";

export type SizeChartView = Omit<SizeChartData, "id" | "category_slugs"> & { category_slugs?: string[] };

/** "Size chart" link that opens the category's size chart (dashboard → Size guide) in a modal dialog. */
export function SizeChart({ chart: SIZE_CHART }: { chart: SizeChartView }) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()}>
        Size chart
      </button>

      <dialog ref={ref} aria-labelledby="size-chart-title" onClick={(e) => e.target === ref.current && ref.current?.close()}>
        <h2 id="size-chart-title">Size chart</h2>
        <table>
          <caption>Measurements in {SIZE_CHART.unit}</caption>
          <thead>
            <tr>
              <td />
              {SIZE_CHART.sizes.map((s) => (
                <th key={s} scope="col">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIZE_CHART.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {r.values.map((v, i) => (
                  <td key={SIZE_CHART.sizes[i]}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {SIZE_CHART.note && <p>Note: {SIZE_CHART.note}</p>}
        {/* Not <form method="dialog">: this sits inside the add-to-cart form, and forms can't nest */}
        <button type="button" onClick={() => ref.current?.close()}>
          Close
        </button>
      </dialog>
    </>
  );
}
