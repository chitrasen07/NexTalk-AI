"use client";

import * as React from "react";
import Link from "next/link";
import { BellOff, CheckCheck, Pin } from "lucide-react";
import { UserAvatar } from "@/components/chat/user-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatConversationTime } from "@/lib/datetime";
import { getConversationDisplay } from "@/lib/chat/helpers";
import { getUnreadCount } from "@/lib/chat/messages";
import { useMyMembership } from "@/hooks/use-conversations";
import { usePresence } from "@/hooks/use-presence";
import { useProfilesStore } from "@/store/profiles-store";
import type { Conversation } from "@/types";

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string;
  active: boolean;
}

export function ConversationListItem({
  conversation,
  currentUserId,
  active,
}: ConversationListItemProps) {
  const profiles = useProfilesStore((s) => s.profiles);
  const member = useMyMembership(conversation.id, currentUserId);
  const [unread, setUnread] = React.useState(0);

  const display = getConversationDisplay(conversation, currentUserId, profiles);
  const presence = usePresence(display.otherUserId);
  const online = presence?.state === "online";

  const lastMessage = conversation.lastMessage;
  const isOwnLast = lastMessage?.senderId === currentUserId;

  // Compute unread count when the last message or read state changes.
  React.useEffect(() => {
    let cancelled = false;
    if (!lastMessage || isOwnLast) {
      setUnread(0);
      return;
    }
    void getUnreadCount(conversation.id, member?.lastReadAt ?? null)
      .then((count) => {
        if (!cancelled) setUnread(count);
      })
      .catch(() => {
        if (!cancelled) setUnread(0);
      });
    return () => {
      cancelled = true;
    };
  }, [conversation.id, lastMessage, isOwnLast, member?.lastReadAt, conversation.updatedAt]);

  const previewText = lastMessage?.text ?? "No messages yet";
  const senderName =
    isOwnLast && lastMessage
      ? "You: "
      : conversation.type === "group" && lastMessage
        ? `${profiles[lastMessage.senderId]?.name?.split(" ")[0] ?? ""}: `
        : "";

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
        active ? "bg-secondary" : "hover:bg-secondary/60",
      )}
    >
      <UserAvatar
        name={display.title}
        photoURL={display.photoURL}
        online={online}
        showPresence={conversation.type === "direct"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">{display.title}</span>
          <span
            className={cn(
              "shrink-0 text-xs",
              unread > 0 ? "font-medium text-primary" : "text-muted-foreground",
            )}
          >
            {formatConversationTime(
              lastMessage?.createdAt ?? conversation.updatedAt,
            )}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 truncate text-sm text-muted-foreground">
            {isOwnLast ? (
              <CheckCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : null}
            <span className="truncate">
              {senderName}
              {previewText}
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {member?.pinned ? (
              <Pin className="h-3.5 w-3.5 text-muted-foreground" />
            ) : null}
            {member?.muted ? (
              <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
            ) : null}
            {unread > 0 ? (
              <Badge variant="brand" className="h-5 min-w-5 justify-center px-1.5">
                {unread > 99 ? "99+" : unread}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
