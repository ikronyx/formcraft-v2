import { createAuthClient } from "better-auth/react";
import { BASE_PATH } from "@/lib/base-path";

export const authClient = createAuthClient({ basePath: `${BASE_PATH}/api/auth` });
