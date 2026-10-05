import { listQuestionnaires } from "@/lib/questionnaire/queries";
import { formatDateTime } from "@/lib/utils";
import { QuestionnaireList } from "@/components/dashboard/questionnaire-list";

export async function QuestionnaireListLoader({ userId }: { userId: string }) {
  const rows = await listQuestionnaires(userId);
  return (
    <QuestionnaireList
      items={rows.map((q) => ({
        id: q.id,
        title: q.title,
        slug: q.slug,
        status: q.status,
        responseCount: q._count.responses,
        questionCount: q._count.questions,
        updatedAt: formatDateTime(q.updatedAt),
      }))}
    />
  );
}
