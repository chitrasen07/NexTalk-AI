import { create } from "zustand";
import type { UserProfile } from "@/types";
import { getUsersByIds } from "@/lib/firebase/firestore";

interface ProfilesStore {
  profiles: Record<string, UserProfile>;
  pending: Set<string>;
  setProfiles: (profiles: UserProfile[]) => void;
  /** Fetch any ids that aren't cached yet. */
  ensureProfiles: (ids: string[]) => Promise<void>;
}

export const useProfilesStore = create<ProfilesStore>((set, get) => ({
  profiles: {},
  pending: new Set<string>(),
  setProfiles: (profiles) =>
    set((state) => {
      const next = { ...state.profiles };
      for (const profile of profiles) next[profile.uid] = profile;
      return { profiles: next };
    }),
  ensureProfiles: async (ids) => {
    const state = get();
    const missing = Array.from(new Set(ids)).filter(
      (id) => id && !state.profiles[id] && !state.pending.has(id),
    );
    if (missing.length === 0) return;

    const pending = new Set(state.pending);
    missing.forEach((id) => pending.add(id));
    set({ pending });

    try {
      const fetched = await getUsersByIds(missing);
      set((s) => {
        const nextProfiles = { ...s.profiles };
        for (const profile of fetched) nextProfiles[profile.uid] = profile;
        const nextPending = new Set(s.pending);
        missing.forEach((id) => nextPending.delete(id));
        return { profiles: nextProfiles, pending: nextPending };
      });
    } catch {
      set((s) => {
        const nextPending = new Set(s.pending);
        missing.forEach((id) => nextPending.delete(id));
        return { pending: nextPending };
      });
    }
  },
}));
