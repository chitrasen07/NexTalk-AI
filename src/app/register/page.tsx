import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { PublicOnlyRoute } from "@/components/auth/public-only-route";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account — NexTalk AI",
};

export default function RegisterPage() {
  return (
    <PublicOnlyRoute>
      <AuthShell>
        <RegisterForm />
      </AuthShell>
    </PublicOnlyRoute>
  );
}
