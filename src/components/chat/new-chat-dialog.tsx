"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Users, X } from "lucide-react";
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
import { searchUsersByUsername } from "@/lib/firebase/firestore";
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
  const { user } = useAuth();
  const [term, setTerm] = React.useState("");
  const [results, setResults] = React.useState<UserProfile[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selected, setSelected] = React.useState<UserProfile[]>([]);
  const [groupMode, setGroupMode] = React.useState(false);
  const [groupName, setGroupName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setTerm("");
      setResults([]);
      setSelected([]);
      setGroupMode(false);
      setGroupName("");
    }
  }, [open]);

  React.useEffect(() => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      void searchUsersByUsername(term)
        .then((users) => {
          setResults(users.filter((u) => u.uid !== user?.uid));
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [term, user?.uid]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{groupMode ? "New group" : "New chat"}</DialogTitle>
          <DialogDescription>
            {groupMode
              ? "Pick at least two people and name your group."
              : "Search for someone by their username to start chatting."}
          </DialogDescription>
        </DialogHeader>

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
            placeholder="Search username…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label="Search users"
          />
        </div>

        <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin">
          {searching ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 && term ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No users found for &ldquo;{term}&rdquo;.
            </p>
          ) : (
            results.map((u) => {
              const isSelected = selected.some((s) => s.uid === u.uid);
              return (
                <button
                  key={u.uid}
                  onClick={() =>
                    groupMode ? toggleSelect(u) : void startDirect(u)
                  }
                  disabled={creating}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary ${
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
                  {groupMode && isSelected ? (
                    <Badge variant="brand">Selected</Badge>
                  ) : null}
                </button>
              );
            })
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
              onClick={createGroup}
              disabled={
                creating || selected.length < 2 || !groupName.trim()
              }
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
