import { redirect } from "next/navigation";
import { EmailActionForm } from "@/components/email-action-form";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <EmailActionForm
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to choose a new password."
      submitLabel="Send reset link"
      successMessage="Reset link sent"
      endpoint="/api/auth/forgot-password"
    />
  );
}
