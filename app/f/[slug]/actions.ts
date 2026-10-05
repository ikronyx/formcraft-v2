"use server";

import { headers } from "next/headers";
import { processSubmission } from "@/lib/questionnaire/submit";
import type { ActionResult } from "@/lib/questionnaire/types";

export async function submitResponseAction(slug: string, values: unknown): Promise<ActionResult> {
  if (typeof slug !== "string" || slug.length > 100) return { ok: false, error: "Invalid questionnaire." };
  const userAgent = (await headers()).get("user-agent");
  return processSubmission(slug, values, userAgent);
}
