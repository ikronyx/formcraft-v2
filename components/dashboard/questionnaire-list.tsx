"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteQuestionnaireAction, setQuestionnaireStatusAction } from "@/lib/questionnaire/actions";
import type { ListItem } from "@/lib/questionnaire/types";
import { withBase } from "@/lib/base-path";
import { Button, buttonClasses } from "@/components/ui/button";
import { Badge, ConfirmDialog, Notice } from "@/components/ui/misc";

export function QuestionnaireList({ items }: { items: ListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ListItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(item: ListItem) {
    setError(null);
    setBusyId(item.id);
    startTransition(async () => {
      const res = await setQuestionnaireStatusAction(item.id, item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED");
      if (!res.ok) setError(`${item.title}: ${res.error}`);
      setBusyId(null);
      router.refresh();
    });
  }

  function remove() {
    if (!toDelete) return;
    const target = toDelete;
    setError(null);
    startTransition(async () => {
      const res = await deleteQuestionnaireAction(target.id);
      if (!res.ok) setError(res.error);
      setToDelete(null);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white px-6 py-14 text-center">
        <h3 className="text-base font-semibold">No questionnaires yet</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Create your first questionnaire, publish it, and share the link to start collecting responses.</p>
        <Link href="/questionnaires/new" className={buttonClasses({ className: "mt-5" })}>
          <Plus className="h-4 w-4" aria-hidden /> New questionnaire
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <Notice kind="error">{error}</Notice>}
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/questionnaires/${item.id}/edit`} className="truncate font-semibold hover:text-brand">
                  {item.title}
                </Link>
                <Badge tone={item.status === "PUBLISHED" ? "live" : "neutral"}>{item.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">
                {item.responseCount} {item.responseCount === 1 ? "response" : "responses"}, {item.questionCount}{" "}
                {item.questionCount === 1 ? "question" : "questions"}. Updated {item.updatedAt}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/questionnaires/${item.id}/edit`} className={buttonClasses({ variant: "outline", size: "sm" })}>
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
              </Link>
              <Link href={`/questionnaires/${item.id}/responses`} className={buttonClasses({ variant: "outline", size: "sm" })}>
                <BarChart3 className="h-3.5 w-3.5" aria-hidden /> Responses
              </Link>
              {item.status === "PUBLISHED" && (
                <a href={withBase(`/f/${item.slug}`)} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "ghost", size: "sm" })}>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open
                </a>
              )}
              <Button variant="outline" size="sm" onClick={() => toggle(item)} loading={pending && busyId === item.id}>
                {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Delete ${item.title}`} onClick={() => setToDelete(item)}>
                <Trash2 className="h-4 w-4 text-red-600" aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={!!toDelete}
        title="Delete this questionnaire?"
        description={`"${toDelete?.title ?? ""}" and all of its questions and responses will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete questionnaire"
        pending={pending}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
