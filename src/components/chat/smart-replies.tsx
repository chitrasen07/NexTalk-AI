"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { callGenerateSmartReplies } from "@/lib/firebase/functions";
import type { ClientMessage } from "@/types";

interface SmartRepliesProps {
  conversationId: string;
  lastMessage: ClientMessage | null;
  currentUserId: string;
  onPick: (reply: string) => void;
}

export function SmartReplies({
  conversationId,
  lastMessage,
  currentUserId,
  onPick,
}: SmartRepliesProps) {
  const [replies, setReplies] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const lastHandledId = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (
      !lastMessage ||
      lastMessage.senderId === currentUserId ||
      !lastMessage.text ||
      lastMessage.deletedAt !== null ||
      lastMessage.id === lastHandledId.current
    ) {
      return;
    }
    lastHandledId.current = lastMessage.id;
    setLoading(true);
    setReplies([]);
    callGenerateSmartReplies({
      conversationId,
      messageText: lastMessage.text,
    })
      .then((res) => setReplies(res.data.replies.slice(0, 3)))
      .catch(() => setReplies([]))
      .finally(() => setLoading(false));
  }, [lastMessage, conversationId, currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
        Generating smart replies…
      </div>
    );
  }

  if (replies.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-1.5">
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      {replies.map((reply, i) => (
        <button
          key={`${reply}-${i}`}
          onClick={() => onPick(reply)}
          className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/10"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
