import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getSession()) redirect("/dashboard");
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
      <p className="mb-6 text-xl font-bold tracking-tight">
        <span className="mr-2 inline-block h-3 w-3 rounded-sm bg-mark align-baseline" aria-hidden />
        Formcraft
      </p>
      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">{children}</div>
    </main>
  );
}
