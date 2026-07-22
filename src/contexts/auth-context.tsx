"use client";

import * as React from "react";
import type { User } from "firebase/auth";
import {
  configurePersistence,
  loginWithEmail,
  loginWithGoogle as firebaseLoginWithGoogle,
  logout as firebaseLogout,
  registerWithEmail,
  resetPassword as firebaseResetPassword,
  sendVerificationEmail,
  subscribeToAuthState,
  updateAuthProfile,
} from "@/lib/firebase/auth";
import {
  ensureUserProfile,
  subscribeToUserProfile,
} from "@/lib/firebase/firestore";
import type { UserProfile } from "@/types";

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (
    name: string,
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Restore auth session and subscribe to the current user's profile document.
  React.useEffect(() => {
    let profileUnsub: (() => void) | undefined;

    const authUnsub = subscribeToAuthState((nextUser) => {
      setUser(nextUser);

      if (profileUnsub) {
        profileUnsub();
        profileUnsub = undefined;
      }

      if (nextUser) {
        profileUnsub = subscribeToUserProfile(nextUser.uid, (nextProfile) => {
          setProfile(nextProfile);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const register = React.useCallback<AuthContextValue["register"]>(
    async (name, username, email, password) => {
      const credential = await registerWithEmail(email, password);
      await updateAuthProfile(credential.user, { displayName: name });
      await ensureUserProfile(credential.user.uid, {
        name,
        username: username.toLowerCase(),
        email,
        photoURL: null,
      });
      await sendVerificationEmail(credential.user);
    },
    [],
  );

  const login = React.useCallback<AuthContextValue["login"]>(
    async (email, password, remember = true) => {
      await configurePersistence(remember);
      await loginWithEmail(email, password);
    },
    [],
  );

  const loginWithGoogle = React.useCallback<
    AuthContextValue["loginWithGoogle"]
  >(async () => {
    await configurePersistence(true);
    const credential = await firebaseLoginWithGoogle();
    const gUser = credential.user;
    const derivedUsername =
      (gUser.email?.split("@")[0] ?? `user${gUser.uid.slice(0, 6)}`).toLowerCase();
    await ensureUserProfile(gUser.uid, {
      name: gUser.displayName ?? "New User",
      username: derivedUsername,
      email: gUser.email ?? "",
      photoURL: gUser.photoURL ?? null,
    });
  }, []);

  const logout = React.useCallback(async () => {
    await firebaseLogout();
  }, []);

  const resetPassword = React.useCallback(async (email: string) => {
    await firebaseResetPassword(email);
  }, []);

  const resendVerification = React.useCallback(async () => {
    if (user) await sendVerificationEmail(user);
  }, [user]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      register,
      login,
      loginWithGoogle,
      logout,
      resetPassword,
      resendVerification,
    }),
    [
      user,
      profile,
      loading,
      register,
      login,
      loginWithGoogle,
      logout,
      resetPassword,
      resendVerification,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
