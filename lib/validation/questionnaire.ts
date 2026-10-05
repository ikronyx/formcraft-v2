import { z } from "zod";
import { hasOptions, QUESTION_TYPES, type QuestionSettings } from "@/lib/questionnaire/types";

export const settingsSchema = z.object({
  placeholder: z.string().trim().max(200).optional(),
  min: z.number({ invalid_type_error: "Minimum must be a number." }).finite().optional(),
  max: z.number({ invalid_type_error: "Maximum must be a number." }).finite().optional(),
  options: z
    .array(z.string().trim().min(1, "Options cannot be empty.").max(200, "Options are limited to 200 characters."))
    .max(50, "Use 50 options or fewer.")
    .optional(),
});

/** Parse settings stored in the DB; never throws. */
export function parseSettings(json: unknown): QuestionSettings {
  const r = settingsSchema.safeParse(json ?? {});
  return r.success ? r.data : {};
}

export const questionInputSchema = z
  .object({
    id: z.string().min(1).max(64),
    type: z.enum(QUESTION_TYPES),
    label: z.string().trim().min(1, "Question text is required.").max(300, "Question text is limited to 300 characters."),
    description: z.string().trim().max(1000, "Description is limited to 1000 characters.").nullable().optional(),
    required: z.boolean(),
    settings: settingsSchema,
  })
  .superRefine((q, ctx) => {
    if (hasOptions(q.type)) {
      const options = q.settings.options ?? [];
      if (options.length < 1) {
        ctx.addIssue({ code: "custom", path: ["settings", "options"], message: "Add at least one option." });
      }
      if (new Set(options).size !== options.length) {
        ctx.addIssue({ code: "custom", path: ["settings", "options"], message: "Options must be unique." });
      }
    }
    const { min, max } = q.settings;
    if (q.type === "number" && min !== undefined && max !== undefined && min > max) {
      ctx.addIssue({ code: "custom", path: ["settings", "max"], message: "Maximum must be greater than or equal to minimum." });
    }
  });

export const saveQuestionnaireSchema = z
  .object({
    title: z.string().trim().min(1, "Give your questionnaire a title.").max(200, "Title is limited to 200 characters."),
    description: z.string().trim().max(2000, "Description is limited to 2000 characters.").nullable().optional(),
    questions: z.array(questionInputSchema).max(100, "A questionnaire can have up to 100 questions."),
  })
  .superRefine((v, ctx) => {
    const ids = v.questions.map((q) => q.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", path: ["questions"], message: "Duplicate question ids." });
    }
  });

export type SaveInput = z.infer<typeof saveQuestionnaireSchema>;

export const createQuestionnaireSchema = z.object({
  title: z.string().trim().min(1, "Give your questionnaire a title.").max(200, "Title is limited to 200 characters."),
  description: z.string().trim().max(2000, "Description is limited to 2000 characters.").optional(),
});

/**
 * Shared by the builder (client) and the save action (server).
 * `errors` is keyed by "title" | "description" | "form" | question id.
 */
export function checkQuestionnaireInput(
  input: unknown,
): { ok: true; data: SaveInput } | { ok: false; error: string; errors: Record<string, string> } {
  const r = saveQuestionnaireSchema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };

  const rawQuestions = input && typeof input === "object" ? (input as { questions?: unknown }).questions : undefined;
  const errors: Record<string, string> = {};
  for (const issue of r.error.issues) {
    let key = "form";
    const [first, second] = issue.path;
    if (first === "title" || first === "description") key = first;
    else if (first === "questions" && typeof second === "number" && Array.isArray(rawQuestions)) {
      const id = (rawQuestions[second] as { id?: unknown } | undefined)?.id;
      if (typeof id === "string") key = id;
    }
    if (!(key in errors)) errors[key] = issue.message;
  }
  const n = Object.keys(errors).length;
  const error = n === 1 ? Object.values(errors)[0] : "Some fields need attention. Check the highlighted items.";
  return { ok: false, error, errors };
}
