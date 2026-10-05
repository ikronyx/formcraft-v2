"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { makeOption, type OptionItem } from "@/components/questionnaire/builder-model";

function OptionRow({ option, index, canDelete, onEdit, onDelete }: {
  option: OptionItem;
  index: number;
  canDelete: boolean;
  onEdit: (value: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: option.key });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1 ${isDragging ? "relative z-10 opacity-80" : ""}`}
    >
      <button type="button" className="touch-none rounded p-1.5 text-slate-400 hover:text-ink" aria-label={`Reorder option ${index + 1}`} {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <Input value={option.value} onChange={(e) => onEdit(e.target.value)} aria-label={`Option ${index + 1}`} className="h-9" />
      <Button variant="ghost" size="icon" aria-label={`Delete option ${index + 1}`} disabled={!canDelete} onClick={onDelete}>
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </li>
  );
}

export function OptionsEditor({ questionId, options, onChange }: { questionId: string; options: OptionItem[]; onChange: (next: OptionItem[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = options.findIndex((o) => o.key === active.id);
    const to = options.findIndex((o) => o.key === over.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(options, from, to));
  }

  return (
    <div className="space-y-2">
      <DndContext id={`options-${questionId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={options.map((o) => o.key)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {options.map((o, i) => (
              <OptionRow
                key={o.key}
                option={o}
                index={i}
                canDelete={options.length > 1}
                onEdit={(value) => onChange(options.map((x) => (x.key === o.key ? { ...x, value } : x)))}
                onDelete={() => onChange(options.filter((x) => x.key !== o.key))}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <Button variant="ghost" size="sm" onClick={() => onChange([...options, makeOption(`Option ${options.length + 1}`)])}>
        <Plus className="h-4 w-4" aria-hidden /> Add option
      </Button>
    </div>
  );
}
