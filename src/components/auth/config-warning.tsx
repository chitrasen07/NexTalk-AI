import { AlertTriangle } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase/config";

/**
 * Shown when the required Firebase env vars are missing so developers get a
 * clear signal instead of opaque runtime errors.
 */
export function ConfigWarning() {
  if (isFirebaseConfigured) return null;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Firebase is not configured yet.</p>
        <p className="text-amber-700/80 dark:text-amber-400/80">
          Copy <code className="font-mono">.env.example</code> to{" "}
          <code className="font-mono">.env.local</code> and add your Firebase
          project credentials. See <code className="font-mono">docs/FIREBASE_SETUP.md</code>.
        </p>
      </div>
    </div>
  );
}
