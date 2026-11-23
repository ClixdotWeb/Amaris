import Link from "next/link";

export const metadata = { title: "Admin", robots: { index: false } };

/** Shown instead of /admin/* in preview mode (middleware rewrite): the admin panel needs the database. */
export default function AdminPreviewPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Admin panel</p>
      <h1 className="mt-4 font-display text-4xl">Needs the database</h1>
      <p className="mt-4 text-muted">
        The site is running in preview mode on sample data. Add the Supabase keys to <code>.env.local</code> to manage
        products and orders here.
      </p>
      <Link href="/" className="btn-primary mt-8">Back to store</Link>
    </main>
  );
}
