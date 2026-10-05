import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getPublishedBySlug, toQuestionDef } from "@/lib/questionnaire/queries";
import { validateAnswers } from "@/lib/validation/submission";
import type { ActionResult } from "@/lib/questionnaire/types";

/** Validates a public submission against the stored definition and writes Response + Answers. */
export async function processSubmission(
  slug: string,
  raw: unknown,
  userAgent: string | null,
): Promise<ActionResult> {
  try {
    const questionnaire = await getPublishedBySlug(slug);
    if (!questionnaire) return { ok: false, error: "This questionnaire is not accepting responses." };

    const defs = questionnaire.questions.map(toQuestionDef);
    const result = validateAnswers(defs, raw);
    if (!result.ok) {
      return { ok: false, error: result.errors.form ?? "Please fix the highlighted answers.", fieldErrors: result.errors };
    }

    const byId = new Map(defs.map((d) => [d.id, d]));
    await prisma.response.create({
      data: {
        questionnaireId: questionnaire.id,
        metadata: { userAgent: userAgent?.slice(0, 300) ?? null },
        answers: {
          create: result.answers.map((a) => {
            const def = byId.get(a.questionId)!;
            return {
              questionId: a.questionId,
              questionLabel: def.label,
              questionType: def.type,
              value: a.value as Prisma.InputJsonValue,
            };
          }),
        },
      },
    });
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("[processSubmission]", e);
    return { ok: false, error: "We couldn't save your response. Please try again." };
  }
}
