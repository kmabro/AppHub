import Link from "next/link";
import { redirect } from "next/navigation";
import { Flag, Layers3, ShieldCheck, Users } from "lucide-react";
import { getAdminSession, getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { AdminActionButton } from "@/components/admin-action-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect((await getSession()) ? "/dashboard" : "/admin/login");
  }

  const stats = await query<{
    users: string;
    apps: string;
    reviews: string;
    open_reports: string;
  }>(
    `SELECT
      (SELECT count(*) FROM users WHERE is_admin = false) AS users,
      (SELECT count(*) FROM apps) AS apps,
      (SELECT count(*) FROM reviews) AS reviews,
      (SELECT count(*) FROM reports WHERE status = 'open') AS open_reports`
  );
  const s = stats.rows[0];

  const { rows: users } = await query<{
    id: string;
    name: string;
    email: string;
    username: string | null;
    is_admin: boolean;
    is_blocked: boolean;
    email_verified: boolean;
    created_at: string;
    app_count: string;
  }>(
    `SELECT u.*, (SELECT count(*) FROM apps a WHERE a.owner_id = u.id) AS app_count
     FROM users u ORDER BY u.created_at DESC`
  );

  const { rows: apps } = await query<{
    id: string;
    name: string;
    owner_name: string;
    status: string;
    featured: boolean;
    downloads: number;
    version: string;
    pending: string;
  }>(
    `SELECT a.id, a.name, a.status, a.featured, a.downloads, a.version,
            u.name AS owner_name,
            (SELECT count(*) FROM app_versions v WHERE v.app_id = a.id AND v.status = 'pending') AS pending
     FROM apps a JOIN users u ON u.id = a.owner_id
     ORDER BY a.created_at DESC`
  );

  const { rows: versions } = await query<{
    id: string;
    app_id: string;
    app_name: string;
    version: string;
    release_notes: string;
    created_at: string;
  }>(
    `SELECT v.*, a.name AS app_name FROM app_versions v
     JOIN apps a ON a.id = v.app_id
     WHERE v.status = 'pending' ORDER BY v.created_at DESC`
  );

  const { rows: reports } = await query<{
    id: string;
    reason: string;
    status: string;
    created_at: string;
    app_name: string | null;
    review_body: string | null;
    reporter: string;
  }>(
    `SELECT r.*, a.name AS app_name, rv.body AS review_body, u.name AS reporter
     FROM reports r
     LEFT JOIN apps a ON a.id = r.app_id
     LEFT JOIN reviews rv ON rv.id = r.review_id
     JOIN users u ON u.id = r.reporter_id
     ORDER BY r.created_at DESC`
  );

  const cards = [
    { icon: Users, label: "Total users", value: s?.users ?? 0 },
    { icon: Layers3, label: "Applications", value: s?.apps ?? 0 },
    { icon: ShieldCheck, label: "Reviews", value: s?.reviews ?? 0 },
    { icon: Flag, label: "Open reports", value: s?.open_reports ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="rise-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the class marketplace: students, apps, releases, and reports.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value }, index) => (
          <div
            key={label}
            style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}
            className="card-lift rise-in flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5"
          >
            <span className="icon-bubble flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600">
              <Icon size={19} />
            </span>
            <div>
              <p className="text-2xl font-semibold leading-none text-slate-900">{value}</p>
              <p className="mt-1.5 text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <Section title="Pending releases" subtitle="Approve or reject new versions before they go live.">
        {versions.length ? (
          <div className="divide-y divide-slate-100">
            {versions.map((version) => (
              <div key={version.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {version.app_name} <span className="text-slate-400">v{version.version}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {version.release_notes || "No release notes"} · {formatDate(version.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <AdminActionButton
                    endpoint={`/api/admin/versions/${version.id}`}
                    action="approve"
                    label="Approve"
                    method="POST"
                  />
                  <AdminActionButton
                    endpoint={`/api/admin/versions/${version.id}`}
                    action="reject"
                    label="Reject"
                    method="POST"
                    danger
                    confirmText="Reject and delete this uploaded file?"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No pending releases.</Empty>
        )}
      </Section>

      <Section title="Applications" subtitle="Suspend inappropriate apps or feature the best ones on the homepage.">
        <div className="divide-y divide-slate-100">
          {apps.map((app) => (
            <div key={app.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/apps/${app.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                    {app.name}
                  </Link>
                  <span className="text-xs text-slate-400">v{app.version}</span>
                  {app.status === "suspended" && (
                    <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">Suspended</span>
                  )}
                  {app.featured && (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Featured</span>
                  )}
                  {Number(app.pending) > 0 && (
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                      {app.pending} pending
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  by {app.owner_name} · {app.downloads} downloads
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminActionButton
                  endpoint={`/api/admin/apps/${app.id}`}
                  action={app.status === "suspended" ? "restore" : "suspend"}
                  label={app.status === "suspended" ? "Restore" : "Suspend"}
                  confirmText={app.status === "suspended" ? undefined : "Suspend this app?"}
                />
                <AdminActionButton
                  endpoint={`/api/admin/apps/${app.id}`}
                  action={app.featured ? "unfeature" : "feature"}
                  label={app.featured ? "Unfeature" : "Feature"}
                />
                <AdminActionButton
                  endpoint={`/api/admin/apps/${app.id}`}
                  action="delete"
                  label="Delete"
                  danger
                  confirmText={`Permanently delete ${app.name} and all its files?`}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Reports" subtitle="Review inappropriate apps or reviews from students.">
        {reports.length ? (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <div key={report.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{report.reason}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {report.app_name || "Review"} · by {report.reporter} · {formatDate(report.created_at)}
                  </p>
                  {report.review_body && (
                    <p className="mt-1 truncate text-xs italic text-slate-400">“{report.review_body}”</p>
                  )}
                  <span className="mt-1 inline-block text-xs text-slate-400">{report.status}</span>
                </div>
                {report.status === "open" && (
                  <div className="flex gap-2">
                    <AdminActionButton endpoint={`/api/admin/reports/${report.id}`} action="resolve" label="Resolve" />
                    <AdminActionButton endpoint={`/api/admin/reports/${report.id}`} action="dismiss" label="Dismiss" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty>No reports yet.</Empty>
        )}
      </Section>

      <Section title="Registered students" subtitle="Everyone with an account on AppHub.">
        <div className="divide-y divide-slate-100">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{user.name}</p>
                  {user.is_admin && (
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">Admin</span>
                  )}
                  {user.is_blocked && (
                    <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">Blocked</span>
                  )}
                  {!user.email_verified && (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      Unverified
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {user.email} · @{user.username || "—"} · {user.app_count} apps · joined{" "}
                  {formatDate(user.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!user.email_verified && (
                  <AdminActionButton
                    endpoint={`/api/admin/users/${user.id}`}
                    action="verify"
                    label="Verify"
                  />
                )}
                {!user.is_admin && (
                  <>
                    <AdminActionButton
                      endpoint={`/api/admin/users/${user.id}`}
                      action={user.is_blocked ? "unblock" : "block"}
                      label={user.is_blocked ? "Unblock" : "Block"}
                      confirmText={user.is_blocked ? undefined : `Block ${user.name}?`}
                    />
                    <AdminActionButton
                      endpoint={`/api/admin/users/${user.id}`}
                      action="delete"
                      label="Delete"
                      danger
                      confirmText={`Delete ${user.name}, their apps, and all their files?`}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-slate-400">{children}</p>;
}
