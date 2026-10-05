export const QUESTION_TYPES = [
  "text",
  "textarea",
  "number",
  "email",
  "select",
  "radio",
  "checkbox",
  "boolean",
  "date",
  "rating",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type QuestionnaireStatus = "DRAFT" | "PUBLISHED";

export const QUESTION_TYPE_META: Record<QuestionType, { label: string; hasOptions: boolean }> = {
  text: { label: "Short text", hasOptions: false },
  textarea: { label: "Long text", hasOptions: false },
  number: { label: "Number", hasOptions: false },
  email: { label: "Email", hasOptions: false },
  select: { label: "Dropdown", hasOptions: true },
  radio: { label: "Multiple choice", hasOptions: true },
  checkbox: { label: "Checkboxes", hasOptions: true },
  boolean: { label: "Yes / No", hasOptions: false },
  date: { label: "Date", hasOptions: false },
  rating: { label: "Rating (1–5)", hasOptions: false },
};

export const hasOptions = (type: QuestionType) => QUESTION_TYPE_META[type].hasOptions;
export const isQuestionType = (v: string): v is QuestionType => (QUESTION_TYPES as readonly string[]).includes(v);

export type QuestionSettings = {
  placeholder?: string;
  min?: number;
  max?: number;
  options?: string[];
};

export type QuestionDef = {
  id: string;
  type: QuestionType;
  label: string;
  description: string | null;
  required: boolean;
  order: number;
  settings: QuestionSettings;
};

/** Keep only the settings that make sense for a type (drops stale keys after a type change). */
export function normalizeSettings(type: QuestionType, s: QuestionSettings): QuestionSettings {
  const out: QuestionSettings = {};
  if ((type === "text" || type === "textarea" || type === "number" || type === "email") && s.placeholder) {
    out.placeholder = s.placeholder;
  }
  if (type === "number") {
    if (s.min !== undefined) out.min = s.min;
    if (s.max !== undefined) out.max = s.max;
  }
  if (hasOptions(type)) out.options = s.options ?? [];
  return out;
}

export type AnswerValue = string | number | boolean | string[];

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type ListItem = {
  id: string;
  title: string;
  slug: string;
  status: QuestionnaireStatus;
  responseCount: number;
  questionCount: number;
  updatedAt: string;
};
