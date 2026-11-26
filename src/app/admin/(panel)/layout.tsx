import { requireAdmin } from "@/lib/admin/guard";
import { TO_DISPATCH_STATUSES } from "@/lib/admin/orderStatus";
import { db } from "@/lib/db";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { ToastProvider } from "@/components/admin/Toaster";
import { adminLogout } from "../login/actions";

export const metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

/** Every page under /admin except /admin/login. Middleware checks the session too; this is the check that counts. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [account, toDispatch, reviews] = await Promise.all([
    db.admins.findByEmail(admin.email),
    db.orders.countByStatus(TO_DISPATCH_STATUSES),
    db.reviews.counts(),
  ]);
  return (
    <ToastProvider>
      <AdminFrame admin={{ email: admin.email, name: account?.full_name ?? admin.email }} counts={{ toDispatch, pendingReviews: reviews.pending }} logout={adminLogout}>
        {children}
      </AdminFrame>
    </ToastProvider>
  );
}
