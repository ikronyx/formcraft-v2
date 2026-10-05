import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// Demo credentials (documented in README.md). Change them after first login on any shared environment.
const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "DemoPass123!";
const DEMO_SLUG = "customer-feedback";

const prisma = new PrismaClient();
// A separate Better Auth instance without the Next.js cookie plugin, so it runs outside Next.
const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

const json = (v: unknown) => v as Prisma.InputJsonValue;

async function main() {
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    await auth.api.signUpEmail({ body: { name: "Demo User", email: DEMO_EMAIL, password: DEMO_PASSWORD } });
    user = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL } });
  }

  const clash = await prisma.questionnaire.findUnique({ where: { slug: DEMO_SLUG } });
  if (clash && clash.userId !== user.id) {
    throw new Error(`Slug "${DEMO_SLUG}" is already used by another account; rename it before seeding.`);
  }
  await prisma.questionnaire.deleteMany({ where: { slug: DEMO_SLUG, userId: user.id } });

  const questions = [
    { type: "text", label: "Name", required: true, settings: { placeholder: "Your full name" } },
    { type: "email", label: "Email", required: true, settings: { placeholder: "you@example.com" } },
    { type: "select", label: "Department", required: true, settings: { options: ["IT", "Finance", "HR", "Operations"] } },
    { type: "rating", label: "Overall Satisfaction", required: true, settings: {} },
    { type: "boolean", label: "Would you recommend us?", required: true, settings: {} },
    {
      type: "checkbox",
      label: "Which services did you use?",
      required: false,
      settings: { options: ["Support", "Training", "Consulting", "Onboarding"] },
    },
    { type: "textarea", label: "Additional comments", required: false, settings: { placeholder: "Anything else you'd like to tell us?" } },
  ];

  await prisma.questionnaire.create({
    data: {
      userId: user.id,
      title: "Customer Feedback",
      description: "Tell us how we're doing. It takes about a minute.",
      slug: DEMO_SLUG,
      status: "PUBLISHED",
      publishedAt: new Date(),
      questions: { create: questions.map((q, order) => ({ ...q, order, settings: json(q.settings) })) },
    },
  });

  console.log(`Seeded demo user ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Public form: /f/${DEMO_SLUG}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
