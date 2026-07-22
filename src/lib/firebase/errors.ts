import { FirebaseError } from "firebase/app";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
  "auth/user-not-found": "No account found with those credentials.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/weak-password": "Please choose a stronger password (min 8 characters).",
  "auth/operation-not-allowed": "This sign-in method is currently disabled.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/popup-closed-by-user": "The sign-in window was closed before finishing.",
  "auth/cancelled-popup-request": "Only one sign-in window can be open at a time.",
  "auth/popup-blocked":
    "Your browser blocked the sign-in popup. Please allow popups and retry.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
  "auth/requires-recent-login":
    "Please sign in again to complete this sensitive action.",
  "auth/account-exists-with-different-credential":
    "An account already exists with a different sign-in method.",
};

/** Convert any thrown error into a friendly, user-facing message. */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const mapped = AUTH_ERROR_MESSAGES[error.code];
    if (mapped) return mapped;
    return error.message.replace(/^Firebase:\s*/, "");
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
