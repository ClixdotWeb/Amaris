import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/admin/ui";

export default function AdminNotFound() {
  return (
    <div className="card rounded-card">
      <EmptyState icon={SearchX} title="Not found" action={<Link href="/admin" className="btn-outline btn-sm">Back to overview</Link>}>
        This order, product or page doesn&apos;t exist, or it was removed.
      </EmptyState>
    </div>
  );
}
