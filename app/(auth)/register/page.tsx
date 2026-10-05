import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-4 text-lg font-semibold">Create your account</h1>
      <AuthForm mode="register" />
    </>
  );
}
