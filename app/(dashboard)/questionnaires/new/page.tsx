import type { Metadata } from "next";
import { NewQuestionnaireForm } from "@/components/forms/new-questionnaire-form";

export const metadata: Metadata = { title: "New questionnaire" };

export default function NewQuestionnairePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New questionnaire</h1>
      <div className="rounded-lg border border-line bg-white p-6">
        <NewQuestionnaireForm />
      </div>
    </div>
  );
}
