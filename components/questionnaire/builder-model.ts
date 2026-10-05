import { hasOptions, type QuestionDef, type QuestionType } from "@/lib/questionnaire/types";

export type OptionItem = { key: string; value: string };

/** Editable (string-based) form of a question, used only inside the builder. */
export type BuilderQuestion = {
  id: string;
  type: QuestionType;
  label: string;
  description: string;
  required: boolean;
  placeholder: string;
  min: string;
  max: string;
  options: OptionItem[];
};

let counter = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const makeOption = (value: string): OptionItem => ({ key: uid("opt"), value });

export function fromDef(q: QuestionDef): BuilderQuestion {
  return {
    id: q.id,
    type: q.type,
    label: q.label,
    description: q.description ?? "",
    required: q.required,
    placeholder: q.settings.placeholder ?? "",
    min: q.settings.min !== undefined ? String(q.settings.min) : "",
    max: q.settings.max !== undefined ? String(q.settings.max) : "",
    options: (q.settings.options ?? []).map(makeOption),
  };
}

export function newQuestion(type: QuestionType): BuilderQuestion {
  return {
    id: uid("new"),
    type,
    label: "",
    description: "",
    required: false,
    placeholder: "",
    min: "",
    max: "",
    options: hasOptions(type) ? [makeOption("Option 1"), makeOption("Option 2")] : [],
  };
}

export function duplicateQuestion(q: BuilderQuestion): BuilderQuestion {
  return { ...q, id: uid("new"), label: q.label ? `${q.label} (copy)` : "", options: q.options.map((o) => makeOption(o.value)) };
}

/** Patch to apply when the type changes: keep options between option types, seed them otherwise. */
export function typeChangePatch(q: BuilderQuestion, type: QuestionType): Partial<BuilderQuestion> {
  const options = hasOptions(type) ? (q.options.length ? q.options : [makeOption("Option 1"), makeOption("Option 2")]) : [];
  return { type, options };
}

/** Payload sent to the server action (and validated by the same Zod schema on both sides). */
export function toInput(q: BuilderQuestion) {
  const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
  return {
    id: q.id,
    type: q.type,
    label: q.label,
    description: q.description,
    required: q.required,
    settings: {
      placeholder: q.placeholder || undefined,
      min: q.type === "number" ? num(q.min) : undefined,
      max: q.type === "number" ? num(q.max) : undefined,
      options: hasOptions(q.type) ? q.options.map((o) => o.value) : undefined,
    },
  };
}
