import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await getSession()) redirect("/dashboard");

  const sp = await searchParams;
  const flag = (key: string) => typeof sp[key] === "string";
  const notice = flag("verified")
    ? "verified"
    : flag("registered")
      ? "registered"
      : flag("reset")
        ? "reset"
        : flag("verify")
          ? "verify-invalid"
          : undefined;

  return <AuthForm mode="login" notice={notice} />;
}
