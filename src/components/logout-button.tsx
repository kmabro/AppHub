import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <form action="/api/auth/admin-logout" method="post">
      <button
        type="submit"
        title="Sign out"
        aria-label="Sign out"
        className="nav-link inline-flex items-center gap-1.5 rounded-lg p-1.5 text-sm text-slate-500 transition hover:text-slate-900"
      >
        <LogOut size={16} className="sm:hidden" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </form>
  );
}
