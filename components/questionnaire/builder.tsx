"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { BarChart3, Check, Copy, ExternalLink, Plus, Save } from "lucide-react";
import { saveQuestionnaireAction, setQuestionnaireStatusAction } from "@/lib/questionnaire/actions";
import { QUESTION_TYPE_META, QUESTION_TYPES, type QuestionDef, type QuestionnaireStatus, type QuestionType } from "@/lib/questionnaire/types";
import { withBase } from "@/lib/base-path";
import { checkQuestionnaireInput } from "@/lib/validation/questionnaire";
import { Button, buttonClasses } from "@/components/ui/button";
import { FieldError, Input, Textarea } from "@/components/ui/fields";
import { Badge, Notice } from "@/components/ui/misc";
import { QuestionCard } from "@/components/questionnaire/question-card";
import { duplicateQuestion, fromDef, newQuestion, toInput, type BuilderQuestion } from "@/components/questionnaire/builder-model";

export type BuilderInitial = {
  id: string;
  title: string;
  description: string;
  slug: string;
  status: QuestionnaireStatus;
  questions: QuestionDef[];
};

type Msg = { kind: "ok" | "error"; text: string } | null;

export function QuestionnaireBuilder({ initial }: { initial: BuilderInitial }) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [items, setItems] = useState<BuilderQuestion[]>(() => initial.questions.map(fromDef));
  const [status, setStatus] = useState(initial.status);
  const [slug, setSlug] = useState(initial.slug);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Msg>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const touch = () => {
    setDirty(true);
    setMsg(null);
  };
  const updateItem = (id: string, patch: Partial<BuilderQuestion>) => {
    setItems((list) => list.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    setErrors((e) => {
      if (!(id in e)) return e;
      const { [id]: _removed, ...rest } = e;
      return rest;
    });
    touch();
  };
  const addQuestion = (type: QuestionType) => {
    setItems((list) => [...list, newQuestion(type)]);
    setPickerOpen(false);
    touch();
  };
  const removeItem = (id: string) => {
    setItems((list) => list.filter((q) => q.id !== id));
    touch();
  };
  const duplicateItem = (id: string) => {
    setItems((list) => {
      const i = list.findIndex((q) => q.id === id);
      if (i < 0) return list;
      const copy = [...list];
      copy.splice(i + 1, 0, duplicateQuestion(list[i]));
      return copy;
    });
    touch();
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setItems((list) => arrayMove(list, list.findIndex((q) => q.id === active.id), list.findIndex((q) => q.id === over.id)));
    touch();
  };

  /** Validates (same Zod schema as the server), then saves title, description, questions and order. */
  async function persist(): Promise<boolean> {
    const input = { title, description, questions: items.map(toInput) };
    const check = checkQuestionnaireInput(input);
    if (!check.ok) {
      setErrors(check.errors);
      setMsg({ kind: "error", text: check.error });
      return false;
    }
    const res = await saveQuestionnaireAction(initial.id, input);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      setMsg({ kind: "error", text: res.error });
      return false;
    }
    setItems(res.data.questions.map(fromDef)); // swap temporary ids for the saved ones
    setSlug(res.data.slug);
    setErrors({});
    setDirty(false);
    return true;
  }

  function onSave() {
    startTransition(async () => {
      if (await persist()) setMsg({ kind: "ok", text: "Saved." });
    });
  }

  function onSetStatus(next: QuestionnaireStatus) {
    startTransition(async () => {
      if (next === "PUBLISHED" && !(await persist())) return;
      const res = await setQuestionnaireStatusAction(initial.id, next);
      if (!res.ok) return setMsg({ kind: "error", text: res.error });
      setStatus(res.data.status);
      setSlug(res.data.slug);
      setMsg({ kind: "ok", text: next === "PUBLISHED" ? "Published. Your link is live." : "Unpublished. The link no longer accepts responses." });
    });
  }

  const publicUrl = `${origin}${withBase(`/f/${slug}`)}`;
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg({ kind: "error", text: "Couldn't copy automatically. Select the link and copy it." });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="sticky top-0 z-30 -mx-4 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Badge tone={status === "PUBLISHED" ? "live" : "neutral"}>{status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
          <span className="text-sm text-muted" aria-live="polite">{dirty ? "Unsaved changes" : "All changes saved"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/questionnaires/${initial.id}/responses`} className={buttonClasses({ variant: "ghost", size: "sm" })}>
            <BarChart3 className="h-4 w-4" aria-hidden /> Responses
          </Link>
          <Button variant="outline" onClick={onSave} loading={pending} disabled={!dirty && !pending}>
            <Save className="h-4 w-4" aria-hidden /> {status === "PUBLISHED" ? "Save changes" : "Save draft"}
          </Button>
          {status === "PUBLISHED" ? (
            <Button variant="outline" onClick={() => onSetStatus("DRAFT")} disabled={pending}>Unpublish</Button>
          ) : (
            <Button onClick={() => onSetStatus("PUBLISHED")} disabled={pending}>Publish</Button>
          )}
        </div>
      </div>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {status === "PUBLISHED" && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <span className="font-medium text-emerald-900">Public link</span>
          <input readOnly value={publicUrl} aria-label="Public link" onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded border border-emerald-200 bg-white px-2 py-1.5" />
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? "Copied" : "Copy"}
          </Button>
          <a href={withBase(`/f/${slug}`)} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "outline", size: "sm" })}>
            <ExternalLink className="h-4 w-4" aria-hidden /> Open
          </a>
        </div>
      )}

      <section className="space-y-3 rounded-lg border border-line border-t-8 border-t-brand bg-white p-5">
        <div>
          <Input value={title} onChange={(e) => { setTitle(e.target.value); setErrors((x) => ({ ...x, title: "" })); touch(); }} placeholder="Questionnaire title" aria-label="Questionnaire title" aria-invalid={!!errors.title} className="h-12 text-2xl font-semibold" />
          <FieldError>{errors.title}</FieldError>
        </div>
        <div>
          <Textarea value={description} onChange={(e) => { setDescription(e.target.value); touch(); }} placeholder="Description (optional)" aria-label="Questionnaire description" rows={2} />
          <FieldError>{errors.description}</FieldError>
        </div>
      </section>

      {errors.form && <Notice kind="error">{errors.form}</Notice>}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white px-6 py-10 text-center text-sm text-muted">
          No questions yet. Add your first question below.
        </div>
      ) : (
        <DndContext id="questions-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-3">
              {items.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  error={errors[q.id]}
                  onChange={(patch) => updateItem(q.id, patch)}
                  onDuplicate={() => duplicateItem(q.id)}
                  onDelete={() => removeItem(q.id)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div className="rounded-lg border border-dashed border-brand/50 bg-brand-soft/50 p-4">
        <Button onClick={() => setPickerOpen((o) => !o)} aria-expanded={pickerOpen}>
          <Plus className="h-4 w-4" aria-hidden /> Add question
        </Button>
        {pickerOpen && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5" role="menu" aria-label="Question types">
            {QUESTION_TYPES.map((t) => (
              <Button key={t} variant="outline" size="sm" role="menuitem" onClick={() => addQuestion(t)}>
                {QUESTION_TYPE_META[t].label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
