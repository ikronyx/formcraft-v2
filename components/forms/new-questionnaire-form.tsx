"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createQuestionnaireAction } from "@/lib/questionnaire/actions";
import { createQuestionnaireSchema } from "@/lib/validation/questionnaire";
import { zodResolver } from "@/lib/validation/resolver";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/fields";
import { Notice } from "@/components/ui/misc";

type Values = { title: string; description: string };

export function NewQuestionnaireForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver<Values>(createQuestionnaireSchema), defaultValues: { title: "", description: "" } });

  async function onSubmit(values: Values) {
    setError(null);
    const res = await createQuestionnaireAction(values);
    if (!res.ok) return setError(res.error);
    router.push(`/questionnaires/${res.data.id}/edit`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && <Notice kind="error">{error}</Notice>}
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" className="mt-1.5" placeholder="Customer feedback" autoFocus aria-invalid={!!errors.title} {...register("title")} />
        <FieldError>{errors.title?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" className="mt-1.5" placeholder="Tell people what this is for" aria-invalid={!!errors.description} {...register("description")} />
        <FieldError>{errors.description?.message}</FieldError>
      </div>
      <Button type="submit" loading={isSubmitting}>Create and add questions</Button>
    </form>
  );
}
