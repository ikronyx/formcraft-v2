# Formcraft

A questionnaire builder (Google-Forms-style) in one Next.js app: builder with drag-and-drop, public forms, responses, CSV export.
Stack: Next.js (App Router) · TypeScript · Tailwind · Prisma + PostgreSQL · Better Auth · Zod · React Hook Form · dnd-kit · Lucide.

## Local setup

```bash
npm install
cp .env.example .env            # then edit DATABASE_URL and BETTER_AUTH_SECRET
npx prisma generate
npx prisma migrate dev --name init   # creates prisma/migrations (commit this folder)
npx prisma db seed
npm run dev
```

Open http://localhost:3000.

**Demo login:** `demo@example.com` / `DemoPass123!`
**Demo public form:** `http://localhost:3000/f/customer-feedback` (published by the seed)

## Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Long random string (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Public app URL, no trailing slash |

## Production (any Node host)

```bash
npm install
npx prisma migrate deploy
npx prisma db seed      # optional
npm run build
npm run start           # honours the PORT env var
```

## Namecheap cPanel at https://example.com/formcraft

See the deployment steps provided with this release (sub-folder install: `.env.production` sets `NEXT_PUBLIC_BASE_PATH=/formcraft`, `server.js` is the Passenger startup file).

## Project layout

```
app/(auth)            login, register
app/(dashboard)       dashboard, questionnaires (new / edit / responses)
app/f/[slug]          public form + submit action
app/api               Better Auth handler, CSV export
components/ui         shadcn-style primitives
components/questionnaire   builder, question card, options editor, QuestionRenderer
lib/auth              Better Auth server/client/session helpers
lib/questionnaire     queries, actions, submission, slug, csv
lib/validation        Zod schemas (shared by browser and server)
prisma/               schema + seed
```

## Security notes

- Every dashboard action calls `getUserOrNull()`, then scopes the query by `userId`, then validates with Zod. Other users' questionnaires return 404.
- Public submissions are validated server-side against the stored questions; unknown question ids and options outside the stored list are rejected.
- Answers store a snapshot of the question label/type, so responses remain readable after edits or question deletion.
- CSV cells that look like spreadsheet formulas are prefixed with `'`.
