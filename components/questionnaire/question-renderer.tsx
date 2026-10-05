"use client";

import { FieldError, Input, Select, Textarea } from "@/components/ui/fields";
import { cn } from "@/lib/utils";
import type { QuestionDef } from "@/lib/questionnaire/types";

type Props = {
  question: QuestionDef;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
};

const GROUP_TYPES = ["radio", "checkbox", "boolean", "rating"];

/** Renders any question from its stored definition. Used by every public form. */
export function QuestionRenderer({ question, value, onChange, error, disabled }: Props) {
  const id = `q-${question.id}`;
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const isGroup = GROUP_TYPES.includes(question.type);
  const options = question.settings.options ?? [];
  const describedBy = error ? errorId : undefined;
  const common = { id, disabled, "aria-invalid": !!error, "aria-describedby": describedBy } as const;

  const title = (
    <>
      {question.label}
      {question.required && (
        <>
          <span aria-hidden className="ml-0.5 text-red-600">*</span>
          <span className="sr-only"> (required)</span>
        </>
      )}
    </>
  );

  const choice = "flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-white px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft";

  let control: React.ReactNode;
  switch (question.type) {
    case "text":
    case "email":
    case "date":
      control = (
        <Input
          {...common}
          type={question.type === "text" ? "text" : question.type}
          autoComplete={question.type === "email" ? "email" : "off"}
          placeholder={question.settings.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case "number":
      control = (
        <Input
          {...common}
          type="number"
          inputMode="decimal"
          step="any"
          min={question.settings.min}
          max={question.settings.max}
          placeholder={question.settings.placeholder}
          value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case "textarea":
      control = (
        <Textarea
          {...common}
          rows={4}
          placeholder={question.settings.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case "select":
      control = (
        <Select {...common} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select an option</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
      );
      break;
    case "radio":
      control = (
        <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy} className="space-y-2">
          {options.map((o) => (
            <label key={o} className={choice}>
              <input type="radio" name={id} disabled={disabled} checked={value === o} onChange={() => onChange(o)} className="h-4 w-4 accent-brand" />
              {o}
            </label>
          ))}
        </div>
      );
      break;
    case "checkbox": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      control = (
        <div role="group" aria-labelledby={labelId} aria-describedby={describedBy} className="space-y-2">
          {options.map((o) => (
            <label key={o} className={choice}>
              <input
                type="checkbox"
                disabled={disabled}
                checked={selected.includes(o)}
                onChange={(e) => onChange(e.target.checked ? [...selected, o] : selected.filter((x) => x !== o))}
                className="h-4 w-4 accent-brand"
              />
              {o}
            </label>
          ))}
        </div>
      );
      break;
    }
    case "boolean":
      control = (
        <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy} className="flex gap-2">
          {[
            { label: "Yes", v: true },
            { label: "No", v: false },
          ].map((o) => (
            <label key={o.label} className={cn(choice, "min-w-24")}>
              <input type="radio" name={id} disabled={disabled} checked={value === o.v} onChange={() => onChange(o.v)} className="h-4 w-4 accent-brand" />
              {o.label}
            </label>
          ))}
        </div>
      );
      break;
    case "rating":
      control = (
        <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy} className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name={id} disabled={disabled} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" />
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-md border border-line bg-white text-sm font-semibold",
                  "peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white",
                  "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
                )}
              >
                {n}
              </span>
              <span className="sr-only">{n} out of 5</span>
            </label>
          ))}
        </div>
      );
      break;
  }

  return (
    <div className="space-y-2">
      {isGroup ? (
        <div id={labelId} className="font-medium">{title}</div>
      ) : (
        <label id={labelId} htmlFor={id} className="block font-medium">{title}</label>
      )}
      {question.description && <p className="text-sm text-muted">{question.description}</p>}
      {control}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
