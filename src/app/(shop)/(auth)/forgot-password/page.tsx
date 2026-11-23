import Link from "next/link";
import { AuthCard, AuthForm } from "../AuthForm";
import { requestPasswordReset } from "../actions";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset password" subtitle="We'll email you a link to set a new password.">
      <AuthForm
        action={requestPasswordReset}
        submitLabel="Send reset link"
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
      />
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-muted hover:text-maroon">Back to login</Link>
      </p>
    </AuthCard>
  );
}
