import { INDIA_POST_TRACKING_URL } from "@/config/shop";
import { formatDate } from "@/lib/format";
import { CopyButton } from "@/components/ui/CopyButton";
import type { Order } from "@/types";

/** Consignment number + link to India Post tracking (brief §5). */
export function TrackingInfo({ order }: { order: Pick<Order, "carrier" | "consignment_number" | "dispatched_at" | "is_international"> }) {
  if (!order.consignment_number) return null;
  return (
    <section>
      <h2>Tracking</h2>
      <p>
        Dispatched{order.dispatched_at ? ` on ${formatDate(order.dispatched_at)}` : ""} via {order.carrier ?? "India Post"}
      </p>
      <p>
        Consignment number: <strong>{order.consignment_number}</strong> <CopyButton value={order.consignment_number} />
      </p>
      {!order.is_international && (
        <a href={INDIA_POST_TRACKING_URL} target="_blank" rel="noopener noreferrer">
          Open India Post tracking (paste the number and the captcha, then Search)
        </a>
      )}
    </section>
  );
}
