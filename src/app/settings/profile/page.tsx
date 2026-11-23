import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit profile" };

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { rows } = await query<{
    name: string;
    username: string | null;
    bio: string;
    avatarUrl: string | null;
  }>(
    "SELECT name, username, bio, avatar_url AS \"avatarUrl\" FROM users WHERE id = $1",
    [session.id]
  );
  const user = rows[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rise-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Edit profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set your developer name, username, bio, and picture.
        </p>
      </div>
      <ProfileForm
        name={user.name}
        username={user.username ?? ""}
        bio={user.bio}
        avatarUrl={user.avatarUrl}
      />
    </div>
  );
}
