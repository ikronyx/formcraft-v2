import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Inbox } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { getOwnedQuestionnaire, toQuestionDef } from "@/lib/questionnaire/queries";
import { formatValue } from "@/lib/questionnaire/format";
import { formatDateTime, cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { withBase } from "@/lib/base-path";

export const metadata: Metadata = { title: "Responses" };
export const dynamic = "force-dynamic";

const LIST_LIMIT = 100;

export default async function ResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { r } = await searchParams;
  const questionnaire = await getOwnedQuestionnaire(id, user.id);
  if (!questionnaire) notFound();

  const questions = questionnaire.questions.map(toQuestionDef);
  const [total, responses, selected] = await Promise.all([
    prisma.response.count({ where: { questionnaireId: questionnaire.id } }),
    prisma.response.findMany({
      where: { questionnaireId: questionnaire.id },
      orderBy: { submittedAt: "desc" },
      take: LIST_LIMIT,
      include: { answers: { select: { value: true, questionId: true }, take: 1 } },
    }),
    r
      ? prisma.response.findFirst({ where: { id: r, questionnaireId: questionnaire.id }, include: { answers: true } })
      : Promise.resolve(null),
  ]);

  // Detail rows: current questions in order, then answers whose question was since deleted.
  const detail = selected
    ? [
        ...questions.map((q) => {
          const a = selected.answers.find((x) => x.questionId === q.id);
          return { key: q.id, label: q.label, value: a ? formatValue(a.value) : "" };
        }),
        ...selected.answers
          .filter((a) => !a.questionId)
          .map((a) => ({ key: a.id, label: `${a.questionLabel} (deleted question)`, value: formatValue(a.value) })),
      ]
    : [];

  return (
    <div className="space-y-6">
      <Link href="/questionnaires" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All questionnaires
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{questionnaire.title}</h1>
          <p className="mt-1 text-muted">{total} {total === 1 ? "response" : "responses"}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/questionnaires/${questionnaire.id}/edit`} className={buttonClasses({ variant: "outline" })}>Edit questionnaire</Link>
          {total > 0 && (
            <a href={withBase(`/api/questionnaires/${questionnaire.id}/export`)} download className={buttonClasses()}>
              <Download className="h-4 w-4" aria-hidden /> Export CSV
            </a>
          )}
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white px-6 py-14 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted" aria-hidden />
          <h2 className="mt-3 font-semibold">No responses yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {questionnaire.status === "PUBLISHED" ? "Share your public link to start collecting responses." : "Publish this questionnaire to start collecting responses."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
          <nav aria-label="Responses" className="max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-white">
            <ul className="divide-y divide-line">
              {responses.map((resp) => {
                const preview = resp.answers[0] ? formatValue(resp.answers[0].value) : "No answers";
                return (
                  <li key={resp.id}>
                    <Link
                      href={`?r=${resp.id}`}
                      aria-current={resp.id === selected?.id ? "true" : undefined}
                      className={cn("block px-4 py-3 text-sm hover:bg-slate-50", resp.id === selected?.id && "bg-brand-soft")}
                    >
                      <span className="block font-medium">{formatDateTime(resp.submittedAt)}</span>
                      <span className="block truncate text-muted">{preview}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {total > LIST_LIMIT && <p className="border-t border-line p-3 text-xs text-muted">Showing the latest {LIST_LIMIT}. Export CSV to get all {total}.</p>}
          </nav>

          <section aria-label="Response detail" className="rounded-lg border border-line bg-white p-5">
            {selected ? (
              <>
                <p className="text-sm text-muted">Submitted {formatDateTime(selected.submittedAt)}</p>
                <dl className="mt-4 space-y-4">
                  {detail.map((d) => (
                    <div key={d.key}>
                      <dt className="text-sm font-medium text-muted">{d.label}</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap break-words">{d.value || <span className="text-muted">No answer</span>}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted">Select a response to see the full answers.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
