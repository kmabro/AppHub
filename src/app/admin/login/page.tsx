import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administrator sign in" };

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.is_admin) redirect("/admin");

  return (
    <AuthForm
      mode="login"
      title="Administrator sign in"
      description="Use the admin account to manage students, apps, releases, and reports."
      redirectTo="/admin"
      admin
    />
  );
}
