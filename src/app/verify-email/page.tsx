"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MailCheck, Loader2, RefreshCw, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuth } from "@/contexts/auth-context";
import { auth } from "@/lib/firebase/config";
import { getFriendlyErrorMessage } from "@/lib/firebase/errors";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading, logout, resendVerification } = useAuth();
  const [resending, setResending] = React.useState(false);
  const [checking, setChecking] = React.useState(false);

  const isGoogleUser = user?.providerData.some(
    (p) => p.providerId === "google.com",
  );

  // Redirect once the user is verified (or not signed in).
  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.emailVerified || isGoogleUser) {
      router.replace("/chat");
    }
  }, [loading, user, isGoogleUser, router]);

  // Poll for verification status every few seconds.
  React.useEffect(() => {
    if (!user || user.emailVerified) return;
    const interval = setInterval(() => {
      void auth.currentUser?.reload().then(() => {
        if (auth.currentUser?.emailVerified) {
          toast.success("Email verified!");
          router.replace("/chat");
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [user, router]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast.success("Verification email sent");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        toast.success("Email verified!");
        router.replace("/chat");
      } else {
        toast.info("Not verified yet. Check your inbox and spam folder.");
      }
    } finally {
      setChecking(false);
    }
  };

  if (loading || !user) return <LoadingScreen message="Loading…" />;

  return (
    <AuthShell>
      <div className="text-center">
        <div className="mb-6 flex justify-center lg:hidden">
          <Logo size="md" />
        </div>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight">
          Verify your email
        </h2>
        <p className="mb-8 text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">{user.email}</span>.
          Click the link to activate your account, then come back here.
        </p>

        <div className="space-y-3">
          <Button
            variant="brand"
            className="w-full"
            onClick={handleCheck}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            I&apos;ve verified my email
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Resend verification email
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => {
              void logout().then(() => router.replace("/login"));
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
