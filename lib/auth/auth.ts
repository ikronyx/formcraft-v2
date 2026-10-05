import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db/prisma";
import { BASE_PATH } from "@/lib/base-path";

// BETTER_AUTH_SECRET and BETTER_AUTH_URL (site origin, no path) are read from the environment.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  basePath: `${BASE_PATH}/api/auth`,
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  plugins: [nextCookies()], // must stay last
});
