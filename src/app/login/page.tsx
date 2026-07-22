import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { PublicOnlyRoute } from "@/components/auth/public-only-route";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in — NexTalk AI",
};

export default function LoginPage() {
  return (
    <PublicOnlyRoute>
      <AuthShell>
        <LoginForm />
      </AuthShell>
    </PublicOnlyRoute>
  );
}
