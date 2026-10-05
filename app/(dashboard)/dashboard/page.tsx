import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getDashboardStats } from "@/lib/questionnaire/queries";
import { buttonClasses } from "@/components/ui/button";
import { QuestionnaireListLoader } from "@/components/dashboard/questionnaire-list-loader";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user.id);
  const cards = [
    { label: "Questionnaires", value: stats.total },
    { label: "Published", value: stats.published },
    { label: "Responses collected", value: stats.responses },
  ];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name.split(" ")[0]}</h1>
        <Link href="/questionnaires/new" className={buttonClasses()}>
          <Plus className="h-4 w-4" aria-hidden /> New questionnaire
        </Link>
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-line border-l-4 border-l-brand bg-white p-4">
            <dt className="text-sm text-muted">{c.label}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">{c.value}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="your-questionnaires" className="space-y-3">
        <h2 id="your-questionnaires" className="text-lg font-semibold">Your questionnaires</h2>
        <QuestionnaireListLoader userId={user.id} />
      </section>
    </div>
  );
}
