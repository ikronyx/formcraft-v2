"use client";

import { useState } from "react";
import { Controller, useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import { submitResponseAction } from "@/app/f/[slug]/actions";
import { validateAnswers } from "@/lib/validation/submission";
import type { QuestionDef } from "@/lib/questionnaire/types";
import { QuestionRenderer } from "@/components/questionnaire/question-renderer";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";

type Values = Record<string, unknown>;

function emptyValues(questions: QuestionDef[]): Values {
  return Object.fromEntries(questions.map((q) => [q.id, q.type === "checkbox" ? [] : q.type === "boolean" || q.type === "rating" ? undefined : ""]));
}

export function PublicForm({ slug, questions }: { slug: string; questions: QuestionDef[] }) {
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Same Zod rules the server enforces, derived from the stored question definitions.
  const resolver: Resolver<Values> = async (values) => {
    const r = validateAnswers(questions, values);
    if (r.ok) return { values, errors: {} };
    const errors = Object.fromEntries(Object.entries(r.errors).map(([k, message]) => [k, { type: "validate", message }]));
    return { values: {}, errors: errors as FieldErrors<Values> };
  };

  const { control, handleSubmit, reset, setError, formState: { isSubmitting } } = useForm<Values>({
    resolver,
    defaultValues: emptyValues(questions),
  });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      const res = await submitResponseAction(slug, values);
      if (res.ok) return setDone(true);
      setFormError(res.error);
      for (const [key, message] of Object.entries(res.fieldErrors ?? {})) {
        if (key !== "form") setError(key, { type: "server", message });
      }
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
        <h2 className="mt-3 text-xl font-semibold">Response recorded</h2>
        <p className="mt-1 text-muted">Thanks for taking the time to answer.</p>
        <Button variant="outline" className="mt-5" onClick={() => { reset(emptyValues(questions)); setDone(false); }}>
          Submit another response
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && <Notice kind="error">{formError}</Notice>}
      {questions.map((q) => (
        <div key={q.id} className="rounded-lg border border-line bg-white p-5">
          <Controller
            name={q.id}
            control={control}
            render={({ field, fieldState }) => (
              <QuestionRenderer question={q} value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
            )}
          />
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-sm text-muted"><span className="text-red-600">*</span> Required</p>
        <Button type="submit" loading={isSubmitting}>Submit</Button>
      </div>
    </form>
  );
}
