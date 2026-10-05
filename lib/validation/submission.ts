import { z } from "zod";
import type { AnswerValue, QuestionDef } from "@/lib/questionnaire/types";

export type ValidAnswer = { questionId: string; value: AnswerValue };
export type SubmissionResult =
  | { ok: true; answers: ValidAnswer[] }
  | { ok: false; errors: Record<string, string> };

const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

function isRealDate(s: string): boolean {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Zod schema for one non-empty answer, derived from the stored question definition. */
export function answerSchema(q: QuestionDef): z.ZodTypeAny {
  const options = q.settings.options ?? [];
  switch (q.type) {
    case "text":
      return z.string().trim().max(500, "Keep this under 500 characters.");
    case "textarea":
      return z.string().trim().max(5000, "Keep this under 5,000 characters.");
    case "email":
      return z.string().trim().max(254, "That email address is too long.").email("Enter a valid email address.");
    case "number": {
      let n = z.number({ invalid_type_error: "Enter a valid number." }).finite("Enter a valid number.");
      if (q.settings.min !== undefined) n = n.min(q.settings.min, `Must be at least ${q.settings.min}.`);
      if (q.settings.max !== undefined) n = n.max(q.settings.max, `Must be at most ${q.settings.max}.`);
      return z.preprocess((v) => (typeof v === "string" ? Number(v.trim()) : v), n);
    }
    case "select":
    case "radio":
      return z.string().refine((v) => options.includes(v), "Choose one of the available options.");
    case "checkbox":
      return z
        .array(z.string())
        .max(options.length, "Choose only from the available options.")
        .refine(
          (a) => a.every((x) => options.includes(x)) && new Set(a).size === a.length,
          "Choose only from the available options.",
        );
    case "boolean":
      return z.boolean({ invalid_type_error: "Choose Yes or No." });
    case "date":
      return z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
        .refine(isRealDate, "Enter a valid date.");
    case "rating":
      return z
        .number({ invalid_type_error: "Choose a rating from 1 to 5." })
        .int("Choose a rating from 1 to 5.")
        .min(1, "Choose a rating from 1 to 5.")
        .max(5, "Choose a rating from 1 to 5.");
  }
}

/**
 * Validates a submission against the stored questionnaire definition.
 * Used by the browser (for UX) and by the server action (for security).
 * `errors` is keyed by question id, or "form" for a structurally invalid payload.
 */
export function validateAnswers(questions: QuestionDef[], raw: unknown): SubmissionResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: { form: "Invalid submission." } };
  }
  const input = raw as Record<string, unknown>;
  const known = new Set(questions.map((q) => q.id));
  if (Object.keys(input).some((k) => !known.has(k))) {
    return { ok: false, errors: { form: "Invalid submission." } };
  }

  const errors: Record<string, string> = {};
  const answers: ValidAnswer[] = [];
  for (const q of questions) {
    const v = input[q.id];
    if (isEmpty(v)) {
      if (q.required) errors[q.id] = "This question is required.";
      continue;
    }
    const r = answerSchema(q).safeParse(v);
    if (r.success) answers.push({ questionId: q.id, value: r.data as AnswerValue });
    else errors[q.id] = r.error.issues[0]?.message ?? "Invalid answer.";
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, answers };
}
