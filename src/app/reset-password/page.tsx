import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
