import { AuthCard, AuthForm } from "../AuthForm";
import { updatePassword } from "../actions";

export const metadata = { title: "Set new password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password">
      <AuthForm
        action={updatePassword}
        submitLabel="Update password"
        fields={[{ name: "password", label: "New password (min 8 characters)", type: "password", autoComplete: "new-password" }]}
      />
    </AuthCard>
  );
}
