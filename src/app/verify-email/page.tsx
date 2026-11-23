import { Suspense } from "react";
import { VerifyEmailCard } from "@/components/verify-email-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white" />}>
      <VerifyEmailCard />
    </Suspense>
  );
}
