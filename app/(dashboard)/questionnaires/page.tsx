import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { buttonClasses } from "@/components/ui/button";
import { QuestionnaireListLoader } from "@/components/dashboard/questionnaire-list-loader";

export const metadata: Metadata = { title: "Questionnaires" };
export const dynamic = "force-dynamic";

export default async function QuestionnairesPage() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Questionnaires</h1>
        <Link href="/questionnaires/new" className={buttonClasses()}>
          <Plus className="h-4 w-4" aria-hidden /> New questionnaire
        </Link>
      </div>
      <QuestionnaireListLoader userId={user.id} />
    </div>
  );
}
