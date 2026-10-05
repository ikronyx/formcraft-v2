"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth/auth-client";
import { loginSchema, registerSchema, type RegisterValues } from "@/lib/validation/auth";
import { zodResolver } from "@/lib/validation/resolver";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/fields";
import { Notice } from "@/components/ui/misc";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver<RegisterValues>(isRegister ? registerSchema : loginSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      if (isRegister) {
        const { error } = await authClient.signUp.email({ name: values.name, email: values.email, password: values.password });
        if (error) {
          const duplicate = error.code === "USER_ALREADY_EXISTS" || /exist/i.test(error.message ?? "");
          setFormError(duplicate ? "An account with this email already exists. Try signing in." : (error.message ?? "Couldn't create your account."));
          return;
        }
      } else {
        const { error } = await authClient.signIn.email({ email: values.email, password: values.password });
        if (error) {
          setFormError("Incorrect email or password.");
          return;
        }
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && <Notice kind="error">{formError}</Notice>}
      {isRegister && (
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" autoComplete="name" className="mt-1.5" aria-invalid={!!errors.name} {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" className="mt-1.5" aria-invalid={!!errors.email} {...register("email")} />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          className="mt-1.5"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>
      <Button type="submit" className="w-full" loading={isSubmitting}>
        {isRegister ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/register" className="font-medium text-brand underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
