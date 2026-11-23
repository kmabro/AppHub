import { notFound, redirect } from "next/navigation";
import { AppForm } from "@/components/app-form";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import type { AppRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit app" };

export default async function EditAppPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { rows } = await query<AppRecord>(
    "SELECT id, owner_id, name, package_name, description, category, platform, version, install_method, file_url, external_url, icon_url, screenshots FROM apps WHERE id = $1",
    [id]
  );
  const app = rows[0];
  if (!app) notFound();
  if (app.owner_id !== session.id && !session.is_admin) redirect(`/apps/${id}`);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rise-in">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
          Update your app
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Edit app</h1>
        <p className="mt-1 text-sm text-slate-500">Update the details or replace the install file.</p>
      </div>
      <AppForm initial={app} />
    </div>
  );
}
