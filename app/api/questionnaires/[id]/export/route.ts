import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserOrNull } from "@/lib/auth/session";
import { generateCsv } from "@/lib/questionnaire/csv";
import { getOwnedQuestionnaire, toQuestionDef } from "@/lib/questionnaire/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const questionnaire = await getOwnedQuestionnaire(id, user.id);
  if (!questionnaire) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const responses = await prisma.response.findMany({
      where: { questionnaireId: questionnaire.id },
      orderBy: { submittedAt: "asc" },
      include: { answers: true },
    });
    const csv = generateCsv(questionnaire.questions.map(toQuestionDef), responses);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${questionnaire.slug}-responses.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export csv]", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
