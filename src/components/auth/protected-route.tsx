"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LoadingScreen } from "@/components/loading-screen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** When true, unverified users are redirected to /verify-email. */
  requireVerified?: boolean;
}

/**
 * Guards authenticated areas. Waits for Firebase to restore the session before
 * rendering or redirecting so the login page never flashes.
 */
export function ProtectedRoute({
  children,
  requireVerified = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isGoogleUser = user?.providerData.some(
    (p) => p.providerId === "google.com",
  );
  const needsVerification =
    requireVerified && user !== null && !user.emailVerified && !isGoogleUser;

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (needsVerification) {
      router.replace("/verify-email");
    }
  }, [loading, user, needsVerification, router]);

  if (loading) return <LoadingScreen message="Restoring your session…" />;
  if (!user) return <LoadingScreen message="Redirecting to sign in…" />;
  if (needsVerification)
    return <LoadingScreen message="Verify your email to continue…" />;

  return <>{children}</>;
}
