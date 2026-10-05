import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** For pages: redirects to /login when signed out. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

/** For server actions / route handlers: returns null instead of redirecting. */
export async function getUserOrNull() {
  const session = await getSession();
  return session?.user ?? null;
}
