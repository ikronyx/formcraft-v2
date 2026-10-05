import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

/** Minimal Zod → react-hook-form resolver. */
export function zodResolver<T extends FieldValues>(schema: z.ZodTypeAny): Resolver<T> {
  return async (values) => {
    const r = schema.safeParse(values);
    if (r.success) return { values: r.data as T, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of r.error.issues) {
      const key = issue.path.join(".");
      if (!(key in errors)) errors[key] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<T> };
  };
}
