import { redirect } from "next/navigation";
import { AppForm } from "@/components/app-form";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Publish an app" };

export default async function NewAppPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/apps/new");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Publish an app</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add the details and the install file. Your app will appear in the catalog immediately.
        </p>
      </div>
      <AppForm />
    </div>
  );
}
