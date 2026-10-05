"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getUserOrNull } from "@/lib/auth/session";
import { generateUniqueSlug } from "@/lib/questionnaire/slug";
import { toQuestionDef } from "@/lib/questionnaire/queries";
import {
  normalizeSettings,
  type ActionResult,
  type QuestionDef,
  type QuestionnaireStatus,
} from "@/lib/questionnaire/types";
import { checkQuestionnaireInput, createQuestionnaireSchema } from "@/lib/validation/questionnaire";

const NOT_SIGNED_IN = "Your session has expired. Sign in again.";
const NOT_FOUND = "Questionnaire not found.";
const GENERIC = "Something went wrong. Please try again.";

const toJson = (v: unknown) => v as Prisma.InputJsonValue;
const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

function fail(error: string, fieldErrors?: Record<string, string>): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  return { ok: false, error, fieldErrors };
}

export async function createQuestionnaireAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getUserOrNull();
  if (!user) return fail(NOT_SIGNED_IN);

  const parsed = createQuestionnaireSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const slug = await generateUniqueSlug(parsed.data.title);
      const created = await prisma.questionnaire.create({
        data: { userId: user.id, title: parsed.data.title, description: parsed.data.description || null, slug },
        select: { id: true },
      });
      return { ok: true, data: { id: created.id } };
    } catch (e) {
      if (isUniqueViolation(e)) continue; // slug race: pick another
      console.error("[createQuestionnaireAction]", e);
      return fail(GENERIC);
    }
  }
  return fail(GENERIC);
}

export type SavedState = { questions: QuestionDef[]; slug: string; status: QuestionnaireStatus };

export async function saveQuestionnaireAction(id: string, input: unknown): Promise<ActionResult<SavedState>> {
  const user = await getUserOrNull();
  if (!user) return fail(NOT_SIGNED_IN);

  const checked = checkQuestionnaireInput(input);
  if (!checked.ok) return fail(checked.error, checked.errors);
  const data = checked.data;

  try {
    // Ownership check: the questionnaire must belong to the signed-in user.
    const owned = await prisma.questionnaire.findFirst({
      where: { id, userId: user.id },
      include: { questions: { select: { id: true } } },
    });
    if (!owned) return fail(NOT_FOUND);

    // Only ids that already belong to THIS questionnaire are updated; all others are created
    // with server-generated ids, so a client can never touch another questionnaire's questions.
    const existing = new Set(owned.questions.map((q) => q.id));
    const kept = data.questions.filter((q) => existing.has(q.id)).map((q) => q.id);

    // The slug follows the title only until the questionnaire is first published.
    let slug = owned.slug;
    if (!owned.publishedAt && data.title !== owned.title) slug = await generateUniqueSlug(data.title, owned.id);

    await prisma.$transaction(async (tx) => {
      await tx.questionnaire.update({
        where: { id: owned.id },
        data: { title: data.title, description: data.description || null, slug },
      });
      // Answers keep their snapshot label; their questionId is set to NULL (onDelete: SetNull).
      await tx.question.deleteMany({ where: { questionnaireId: owned.id, id: { notIn: kept } } });
      for (const [index, q] of data.questions.entries()) {
        const fields = {
          type: q.type,
          label: q.label,
          description: q.description || null,
          required: q.required,
          order: index,
          settings: toJson(normalizeSettings(q.type, q.settings)),
        };
        if (existing.has(q.id)) await tx.question.update({ where: { id: q.id }, data: fields });
        else await tx.question.create({ data: { ...fields, questionnaireId: owned.id } });
      }
    });

    const fresh = await prisma.question.findMany({ where: { questionnaireId: owned.id }, orderBy: { order: "asc" } });
    return { ok: true, data: { questions: fresh.map(toQuestionDef), slug, status: owned.status } };
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That URL is already taken. Try saving again.");
    console.error("[saveQuestionnaireAction]", e);
    return fail(GENERIC);
  }
}

export async function setQuestionnaireStatusAction(
  id: string,
  status: QuestionnaireStatus,
): Promise<ActionResult<{ status: QuestionnaireStatus; slug: string }>> {
  const user = await getUserOrNull();
  if (!user) return fail(NOT_SIGNED_IN);
  if (status !== "DRAFT" && status !== "PUBLISHED") return fail("Invalid status.");

  try {
    const owned = await prisma.questionnaire.findFirst({
      where: { id, userId: user.id },
      include: { _count: { select: { questions: true } } },
    });
    if (!owned) return fail(NOT_FOUND);
    if (status === "PUBLISHED" && owned._count.questions === 0) {
      return fail("Add at least one question before publishing.");
    }
    const updated = await prisma.questionnaire.update({
      where: { id: owned.id },
      data: { status, ...(status === "PUBLISHED" && !owned.publishedAt ? { publishedAt: new Date() } : {}) },
      select: { status: true, slug: true },
    });
    return { ok: true, data: updated };
  } catch (e) {
    console.error("[setQuestionnaireStatusAction]", e);
    return fail(GENERIC);
  }
}

export async function deleteQuestionnaireAction(id: string): Promise<ActionResult> {
  const user = await getUserOrNull();
  if (!user) return fail(NOT_SIGNED_IN);
  try {
    // Scoped by userId; questions, responses and answers are removed by ON DELETE CASCADE.
    const { count } = await prisma.questionnaire.deleteMany({ where: { id, userId: user.id } });
    if (count === 0) return fail(NOT_FOUND);
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("[deleteQuestionnaireAction]", e);
    return fail(GENERIC);
  }
}
