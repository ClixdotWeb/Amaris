import Link from "next/link";
import { AuthCard, AuthForm } from "../AuthForm";
import { signup } from "../actions";

export const metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthCard title="Create account" subtitle="Save addresses, measurements and track your orders.">
      <AuthForm
        action={signup}
        next={next}
        submitLabel="Create account"
        fields={[
          { name: "full_name", label: "Full name", autoComplete: "name" },
          { name: "phone", label: "Mobile number", type: "tel", autoComplete: "tel" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password (min 8 characters)", type: "password", autoComplete: "new-password" },
        ]}
      />
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="text-maroon underline underline-offset-4">Log in</Link>
      </p>
    </AuthCard>
  );
}
