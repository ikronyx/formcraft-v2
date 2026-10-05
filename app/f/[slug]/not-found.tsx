export default function QuestionnaireNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold">This questionnaire isn't available</h1>
      <p className="text-muted">The link may be wrong, or the owner has unpublished it.</p>
    </main>
  );
}
