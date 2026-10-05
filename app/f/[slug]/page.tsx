import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedBySlug, toQuestionDef } from "@/lib/questionnaire/queries";
import { PublicForm } from "@/components/forms/public-form";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const q = await getPublishedBySlug(slug).catch(() => null);
  return { title: q?.title ?? "Questionnaire" };
}

export default async function PublicQuestionnairePage({ params }: Params) {
  const { slug } = await params;
  const questionnaire = await getPublishedBySlug(slug);
  if (!questionnaire) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <header className="rounded-lg border border-line border-t-8 border-t-brand bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{questionnaire.title}</h1>
        {questionnaire.description && <p className="mt-2 whitespace-pre-line text-muted">{questionnaire.description}</p>}
      </header>
      <PublicForm slug={questionnaire.slug} questions={questionnaire.questions.map(toQuestionDef)} />
    </main>
  );
}
