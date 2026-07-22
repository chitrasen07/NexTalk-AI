"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Search, UserRoundSearch, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/chat/user-avatar";
import { findPeople } from "@/lib/firebase/firestore";
import {
  createDirectConversation,
  createGroupConversation,
} from "@/lib/chat/conversations";
import { getFriendlyErrorMessage } from "@/lib/firebase/errors";
import { useAuth } from "@/contexts/auth-context";
import type { UserProfile } from "@/types";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewChatDialog({ open, onOpenChange }: NewChatDialogProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [term, setTerm] = React.useState("");
  const [results, setResults] = React.useState<UserProfile[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selected, setSelected] = React.useState<UserProfile[]>([]);
  const [groupMode, setGroupMode] = React.useState(false);
  const [groupName, setGroupName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setTerm("");
      setResults([]);
      setSelected([]);
      setGroupMode(false);
      setGroupName("");
      setLoadError(null);
    }
  }, [open]);

  // Load suggested people when the dialog opens, and search as the user types.
  React.useEffect(() => {
    if (!open) return;
    setSearching(true);
    setLoadError(null);
    const handle = setTimeout(() => {
      void findPeople(term, user?.uid ?? null)
        .then((users) => {
          setResults(users);
          if (users.length === 0 && !term.trim()) {
            setLoadError(null);
          }
        })
        .catch((error) => {
          setResults([]);
          const message = getFriendlyErrorMessage(error);
          const code =
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            typeof (error as { code: unknown }).code === "string"
              ? (error as { code: string }).code
              : "";
          if (code.includes("permission-denied")) {
            setLoadError(
              "Permission denied reading users. Deploy Firestore rules: firebase deploy --only firestore:rules",
            );
          } else {
            setLoadError(message);
          }
        })
        .finally(() => setSearching(false));
    }, term.trim() ? 250 : 0);
    return () => clearTimeout(handle);
  }, [term, user?.uid, open]);

  const startDirect = async (other: UserProfile) => {
    if (!user) return;
    setCreating(true);
    try {
      const id = await createDirectConversation(user.uid, other.uid);
      onOpenChange(false);
      router.push(`/chat/${id}`);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const toggleSelect = (u: UserProfile) => {
    setSelected((prev) =>
      prev.some((s) => s.uid === u.uid)
        ? prev.filter((s) => s.uid !== u.uid)
        : [...prev, u],
    );
  };

  const createGroup = async () => {
    if (!user || selected.length < 2 || !groupName.trim()) return;
    setCreating(true);
    try {
      const id = await createGroupConversation(
        user.uid,
        selected.map((s) => s.uid),
        groupName.trim(),
        null,
      );
      onOpenChange(false);
      router.push(`/chat/${id}`);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const copyUsername = async () => {
    if (!profile?.username) return;
    try {
      await navigator.clipboard.writeText(`@${profile.username}`);
      toast.success("Username copied — share it with friends");
    } catch {
      toast.message(`Your username is @${profile.username}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRoundSearch className="h-5 w-5 text-primary" />
            {groupMode ? "New group" : "Find people"}
          </DialogTitle>
          <DialogDescription>
            {groupMode
              ? "Search people, select at least two, then name your group."
              : "Search by name or username, then tap someone to start chatting."}
          </DialogDescription>
        </DialogHeader>

        {profile?.username ? (
          <button
            type="button"
            onClick={() => void copyUsername()}
            className="rounded-lg border bg-secondary/50 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
          >
            <span className="text-muted-foreground">Your username · </span>
            <span className="font-medium text-primary">@{profile.username}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Share this so friends can find you. Tap to copy.
            </span>
          </button>
        ) : null}

        {groupMode ? (
          <Input
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            aria-label="Group name"
          />
        ) : null}

        {groupMode && selected.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selected.map((u) => (
              <Badge key={u.uid} variant="secondary" className="gap-1 pr-1">
                {u.name}
                <button
                  onClick={() => toggleSelect(u)}
                  aria-label={`Remove ${u.name}`}
                  className="rounded-full p-0.5 hover:bg-background"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name or @username…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label="Search people"
            autoFocus
          />
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto scrollbar-thin">
          {searching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <p className="py-6 text-center text-sm text-destructive">
              {loadError}
            </p>
          ) : results.length === 0 ? (
            <div className="space-y-2 px-2 py-8 text-center">
              <p className="text-sm font-medium">
                {term.trim()
                  ? `No one found for “${term.trim()}”`
                  : "No other people yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {term.trim()
                  ? "Try another name or username. Ask them for their @username."
                  : "Create a second account (or invite a friend) to start chatting."}
              </p>
            </div>
          ) : (
            <>
              {!term.trim() ? (
                <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  People on NexTalk
                </p>
              ) : null}
              {results.map((u) => {
                const isSelected = selected.some((s) => s.uid === u.uid);
                return (
                  <button
                    key={u.uid}
                    onClick={() =>
                      groupMode ? toggleSelect(u) : void startDirect(u)
                    }
                    disabled={creating}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-secondary ${
                      isSelected ? "bg-secondary" : ""
                    }`}
                  >
                    <UserAvatar name={u.name} photoURL={u.photoURL} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        @{u.username}
                      </p>
                    </div>
                    {groupMode ? (
                      isSelected ? (
                        <Badge variant="brand">Selected</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Tap to add
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Chat
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGroupMode((v) => !v)}
          >
            <Users className="h-4 w-4" />
            {groupMode ? "Direct chat" : "New group"}
          </Button>
          {groupMode ? (
            <Button
              variant="brand"
              size="sm"
              onClick={() => void createGroup()}
              disabled={creating || selected.length < 2 || !groupName.trim()}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create group
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
