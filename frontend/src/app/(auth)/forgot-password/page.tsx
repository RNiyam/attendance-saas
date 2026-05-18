import { AppForm } from "@/components/forms/app-form";

export default function ForgotPasswordPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Forgot Password</h1>
      <AppForm
        title="Reset password"
        submitLabel="Send Reset Link"
        fields={[{ name: "email", label: "Work Email", type: "email", placeholder: "you@company.com" }]}
      />
    </section>
  );
}
