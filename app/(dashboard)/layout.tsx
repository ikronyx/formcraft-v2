import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              <span className="mr-2 inline-block h-3 w-3 rounded-sm bg-mark" aria-hidden />
              Formcraft
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-muted">
              <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
              <Link href="/questionnaires" className="hover:text-ink">Questionnaires</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
