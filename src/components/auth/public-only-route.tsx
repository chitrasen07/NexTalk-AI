"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LoadingScreen } from "@/components/loading-screen";

/**
 * Wraps /login and /register. Authenticated users are bounced to /chat so they
 * never see the auth forms again. Waits for session restoration first.
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) {
      router.replace("/chat");
    }
  }, [loading, user, router]);

  if (loading) return <LoadingScreen message="Loading…" />;
  if (user) return <LoadingScreen message="Taking you to your chats…" />;

  return <>{children}</>;
}
