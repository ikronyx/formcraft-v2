import { formatValue } from "@/lib/questionnaire/format";
import type { QuestionDef } from "@/lib/questionnaire/types";

type ExportResponse = {
  id: string;
  submittedAt: Date;
  answers: { questionId: string | null; questionLabel: string; value: unknown }[];
};

/** Neutralise spreadsheet formula injection (=, +, @, leading -text) and quote the cell. */
function cell(value: string): string {
  const safe = /^[=+@\t\r]/.test(value) || /^-(?![\d.])/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** One row per response, one column per question (plus columns for since-deleted questions). */
export function generateCsv(questions: QuestionDef[], responses: ExportResponse[]): string {
  const columns: { key: string; header: string }[] = [];
  const seen = new Map<string, number>();
  const uniqueHeader = (label: string) => {
    const n = (seen.get(label) ?? 0) + 1;
    seen.set(label, n);
    return n === 1 ? label : `${label} (${n})`;
  };
  for (const q of questions) columns.push({ key: q.id, header: uniqueHeader(q.label) });

  const orphanLabels = new Set<string>();
  for (const r of responses) for (const a of r.answers) if (!a.questionId) orphanLabels.add(a.questionLabel);
  for (const label of orphanLabels) columns.push({ key: `orphan:${label}`, header: uniqueHeader(`${label} (deleted question)`) });

  const lines: string[] = [];
  lines.push(["Response ID", "Submitted at (UTC)", ...columns.map((c) => c.header)].map(cell).join(","));
  for (const r of responses) {
    const byKey = new Map<string, unknown>();
    for (const a of r.answers) byKey.set(a.questionId ?? `orphan:${a.questionLabel}`, a.value);
    const row = [r.id, r.submittedAt.toISOString(), ...columns.map((c) => formatValue(byKey.get(c.key)))];
    lines.push(row.map(cell).join(","));
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}
