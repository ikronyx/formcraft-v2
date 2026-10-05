import type { Question } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { parseSettings } from "@/lib/validation/questionnaire";
import { isQuestionType, type QuestionDef } from "@/lib/questionnaire/types";

export function toQuestionDef(q: Question): QuestionDef {
  return {
    id: q.id,
    type: isQuestionType(q.type) ? q.type : "text",
    label: q.label,
    description: q.description,
    required: q.required,
    order: q.order,
    settings: parseSettings(q.settings),
  };
}

/** Ownership-scoped lookup: returns null for missing OR someone else's questionnaire. */
export async function getOwnedQuestionnaire(id: string, userId: string) {
  return prisma.questionnaire.findFirst({
    where: { id, userId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

export async function getPublishedBySlug(slug: string) {
  return prisma.questionnaire.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

export async function listQuestionnaires(userId: string) {
  return prisma.questionnaire.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { responses: true, questions: true } } },
  });
}

export async function getDashboardStats(userId: string) {
  const [total, published, responses] = await Promise.all([
    prisma.questionnaire.count({ where: { userId } }),
    prisma.questionnaire.count({ where: { userId, status: "PUBLISHED" } }),
    prisma.response.count({ where: { questionnaire: { userId } } }),
  ]);
  return { total, published, responses };
}
