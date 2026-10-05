"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FieldError,
  Input,
  Label,
  Select,
  Switch,
} from "@/components/ui/fields";
import { cn } from "@/lib/utils";
import {
  hasOptions,
  QUESTION_TYPE_META,
  QUESTION_TYPES,
  type QuestionType,
} from "@/lib/questionnaire/types";
import {
  typeChangePatch,
  type BuilderQuestion,
} from "@/components/questionnaire/builder-model";
import { OptionsEditor } from "@/components/questionnaire/options-editor";

type Props = {
  question: BuilderQuestion;
  index: number;
  error?: string;
  onChange: (patch: Partial<BuilderQuestion>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const HINTS: Partial<Record<QuestionType, string>> = {
  email: "Answers are checked for a valid email address.",
  boolean: "Respondents choose Yes or No.",
  date: "Respondents pick a calendar date.",
  rating: "Respondents rate from 1 to 5.",
};

export function QuestionCard({
  question: q,
  index,
  error,
  onChange,
  onDuplicate,
  onDelete,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: q.id });
  const showPlaceholder =
    q.type === "text" ||
    q.type === "textarea" ||
    q.type === "number" ||
    q.type === "email";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-lg border border-line border-t-4 border-t-brand bg-white shadow-sm",
        isDragging && "relative z-20 shadow-lg ring-2 ring-brand/40",
        error && "border-red-300 border-t-red-500",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-2 py-1.5 bg-brand">
        <button
          type="button"
          className="flex touch-none items-center gap-1.5 rounded px-1.5 py-1 text-sm text-white hover:text-ink"
          aria-label={`Drag to reorder question ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
          <span className="font-medium">Question {index + 1}</span>
        </button>
        <Select
          aria-label={`Type of question ${index + 1}`}
          value={q.type}
          onChange={(e) =>
            onChange(typeChangePatch(q, e.target.value as QuestionType))
          }
          className="h-8 w-auto text-sm"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_META[t].label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <Label htmlFor={`label-${q.id}`} className="sr-only">
            Question text
          </Label>
          <Input
            id={`label-${q.id}`}
            value={q.label}
            placeholder="Question text"
            onChange={(e) => onChange({ label: e.target.value })}
            aria-invalid={!!error && !q.label.trim()}
            className="text-base font-medium"
          />
        </div>
        <Input
          value={q.description}
          placeholder="Help text (optional)"
          aria-label="Help text"
          onChange={(e) => onChange({ description: e.target.value })}
          className="h-9"
        />

        {showPlaceholder && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={q.type === "number" ? "" : "sm:col-span-3"}>
              <Label htmlFor={`ph-${q.id}`} className="text-xs text-muted">
                Placeholder
              </Label>
              <Input
                id={`ph-${q.id}`}
                value={q.placeholder}
                onChange={(e) => onChange({ placeholder: e.target.value })}
                className="mt-1 h-9"
              />
            </div>
            {q.type === "number" && (
              <>
                <div>
                  <Label htmlFor={`min-${q.id}`} className="text-xs text-muted">
                    Minimum (optional)
                  </Label>
                  <Input
                    id={`min-${q.id}`}
                    type="number"
                    step="any"
                    value={q.min}
                    onChange={(e) => onChange({ min: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor={`max-${q.id}`} className="text-xs text-muted">
                    Maximum (optional)
                  </Label>
                  <Input
                    id={`max-${q.id}`}
                    type="number"
                    step="any"
                    value={q.max}
                    onChange={(e) => onChange({ max: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {hasOptions(q.type) && (
          <OptionsEditor
            questionId={q.id}
            options={q.options}
            onChange={(options) => onChange({ options })}
          />
        )}
        {HINTS[q.type] && <p className="text-sm text-muted">{HINTS[q.type]}</p>}
        <FieldError>{error}</FieldError>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <Switch
            checked={q.required}
            onCheckedChange={(required) => onChange({ required })}
            label={`Question ${index + 1} is required`}
          />
          <span>Required</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Duplicate question ${index + 1}`}
            onClick={onDuplicate}
          >
            <Copy className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete question ${index + 1}`}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-red-600" aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}
