import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils";

/** customer-feedback → customer-feedback-2 → customer-feedback-3 … */
export async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  const taken = await prisma.questionnaire.findMany({
    where: { slug: { startsWith: base }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { slug: true },
  });
  const used = new Set(taken.map((t) => t.slug));
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
