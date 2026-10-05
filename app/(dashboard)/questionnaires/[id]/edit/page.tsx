import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getOwnedQuestionnaire, toQuestionDef } from "@/lib/questionnaire/queries";
import { QuestionnaireBuilder } from "@/components/questionnaire/builder";

export const metadata: Metadata = { title: "Edit questionnaire" };
export const dynamic = "force-dynamic";

export default async function EditQuestionnairePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const q = await getOwnedQuestionnaire(id, user.id); // null if missing or owned by someone else
  if (!q) notFound();

  return (
    <QuestionnaireBuilder
      initial={{
        id: q.id,
        title: q.title,
        description: q.description ?? "",
        slug: q.slug,
        status: q.status,
        questions: q.questions.map(toQuestionDef),
      }}
    />
  );
}
