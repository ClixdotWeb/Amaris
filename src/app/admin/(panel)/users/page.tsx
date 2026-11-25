import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { AddAdminForm } from "./AddAdminForm";
import { removeAdmin } from "./actions";
import type { AdminAccount } from "@/types";

export const metadata = { title: "Admins" };

export default async function AdminUsersPage() {
  const me = await requireAdmin("/admin/users");
  const admins = await db.admins.list();

  return (
    <>
      <PageHeader eyebrow="Settings" title="Admins" description="Everyone here can use the whole dashboard." />

      <Card title="Add an admin">
        <AddAdminForm />
      </Card>

      <Card title={`Admins (${admins.length})`} padded={false}>
        <DataTable<AdminAccount>
          caption="Admin accounts"
          rows={admins}
          rowKey={(a) => a.id}
          empty={<EmptyState icon={Users} title="No admins yet" />}
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (a) => (
                <span className="flex flex-wrap items-center gap-2">
                  {a.full_name} {a.email === me.email && <Badge tone="gold">You</Badge>}
                </span>
              ),
            },
            { key: "email", header: "Email", cell: (a) => a.email },
            { key: "added", header: "Added", cell: (a) => `${formatDate(a.created_at)}${a.created_by ? ` by ${a.created_by}` : " (first admin)"}` },
            { key: "last", header: "Last sign-in", cell: (a) => (a.last_login_at ? formatDate(a.last_login_at) : "Never") },
            {
              key: "actions",
              header: "",
              align: "right",
              cell: (a) =>
                a.email === me.email || admins.length <= 1 ? null : (
                  <ConfirmButton
                    action={removeAdmin}
                    fields={{ id: a.id }}
                    label="Remove"
                    title={`Remove ${a.full_name}?`}
                    message={<>They will be signed out and can no longer use the dashboard. You can add them again later.</>}
                    confirmLabel="Remove admin"
                  />
                ),
            },
          ]}
        />
      </Card>
    </>
  );
}
