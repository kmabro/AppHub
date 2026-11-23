import { redirect } from "next/navigation";
import { EmailActionForm } from "@/components/email-action-form";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resend verification email" };

export default async function ResendVerificationPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <EmailActionForm
      title="Resend verification email"
      description="Enter the email you registered with and we'll send a fresh verification link."
      submitLabel="Send verification email"
      successMessage="Verification email sent"
      endpoint="/api/auth/resend-verification"
    />
  );
}
