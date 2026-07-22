import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { PublicOnlyRoute } from "@/components/auth/public-only-route";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password — NexTalk AI",
};

export default function ForgotPasswordPage() {
  return (
    <PublicOnlyRoute>
      <AuthShell>
        <ForgotPasswordForm />
      </AuthShell>
    </PublicOnlyRoute>
  );
}
