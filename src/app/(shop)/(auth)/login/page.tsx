import Link from "next/link";
import { AuthCard, AuthForm } from "../AuthForm";
import { login } from "../actions";
import { USE_MOCK } from "@/lib/data/mode";

export const metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthCard title="Welcome back" subtitle="Log in to track orders and check out faster.">
      {USE_MOCK && <p className="mb-6 bg-gold-light/40 p-3 text-xs">Preview mode: login works once the database is connected.</p>}
      <AuthForm
        action={login}
        next={next}
        submitLabel="Log in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <div className="mt-6 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-muted hover:text-maroon">Forgot password?</Link>
        <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-maroon underline underline-offset-4">
          Create an account
        </Link>
      </div>
    </AuthCard>
  );
}
