"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Loader2, MailQuestion } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { ConfigWarning } from "@/components/auth/config-warning";
import { useAuth } from "@/contexts/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getFriendlyErrorMessage } from "@/lib/firebase/errors";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = React.useState(false);
  const [sentEmail, setSentEmail] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      await resetPassword(values.email);
      setSentEmail(values.email);
      setSent(true);
      toast.success("Password reset email sent");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mb-6 flex justify-center lg:hidden">
          <Logo size="md" />
        </div>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight">
          Check your inbox
        </h2>
        <p className="mb-8 text-muted-foreground">
          We sent a password reset link to{" "}
          <span className="font-medium text-foreground">{sentEmail}</span>.
          Follow the link to choose a new password.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 lg:hidden">
        <Logo size="md" />
      </div>
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <MailQuestion className="h-7 w-7 text-primary" />
      </div>
      <div className="mb-8 space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Forgot password?</h2>
        <p className="text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <ConfigWarning />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="brand"
          className="w-full"
          disabled={isSubmitting || !isFirebaseConfigured}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Send reset link
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
