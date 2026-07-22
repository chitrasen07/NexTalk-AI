"use client";

import * as React from "react";
import { MessageSquarePlus, Search, Share2, UserRoundSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function ChatIndexPage() {
  const { profile } = useAuth();
  const [newChatOpen, setNewChatOpen] = React.useState(false);

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
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl brand-gradient shadow-xl shadow-primary/25">
        <UserRoundSearch className="h-10 w-10 text-white" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">How to start chatting</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Find people on NexTalk, then open a chat and type a message. Here&apos;s
          the quick path:
        </p>
      </div>

      <ol className="mx-auto w-full max-w-md space-y-3 text-left text-sm">
        <li className="flex gap-3 rounded-xl border bg-card p-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full brand-gradient text-xs font-bold text-white">
            1
          </span>
          <div>
            <p className="font-medium">Find people</p>
            <p className="text-muted-foreground">
              Click <span className="font-medium text-foreground">Find people to chat</span>{" "}
              and search by name or @username.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-xl border bg-card p-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full brand-gradient text-xs font-bold text-white">
            2
          </span>
          <div>
            <p className="font-medium">Tap Chat</p>
            <p className="text-muted-foreground">
              Choose someone from the list to open a conversation instantly.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-xl border bg-card p-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full brand-gradient text-xs font-bold text-white">
            3
          </span>
          <div>
            <p className="font-medium">Share your username</p>
            <p className="text-muted-foreground">
              {profile?.username ? (
                <>
                  Your username is{" "}
                  <span className="font-medium text-primary">
                    @{profile.username}
                  </span>
                  . Friends can search for it to find you.
                </>
              ) : (
                "Share your @username so friends can find you."
              )}
            </p>
          </div>
        </li>
      </ol>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="brand" size="lg" onClick={() => setNewChatOpen(true)}>
          <MessageSquarePlus className="h-4 w-4" />
          Find people to chat
        </Button>
        {profile?.username ? (
          <Button variant="outline" size="lg" onClick={() => void copyUsername()}>
            <Share2 className="h-4 w-4" />
            Copy @{profile.username}
          </Button>
        ) : null}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Search className="h-3.5 w-3.5" />
        Tip: open Find people with an empty search to browse everyone on NexTalk.
      </p>

      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} />
    </div>
  );
}
