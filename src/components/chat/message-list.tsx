"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingBubble } from "@/components/chat/typing-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { isDifferentDay, formatDaySeparator } from "@/lib/datetime";
import { computeOwnMessageStatus } from "@/lib/chat/helpers";
import { useProfilesStore } from "@/store/profiles-store";
import type { ClientMessage, ConversationMember } from "@/types";

interface MessageListProps {
  messages: ClientMessage[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  conversationId: string;
  currentUserId: string;
  members: ConversationMember[];
  isGroup: boolean;
  showTyping: boolean;
  onReply: (message: ClientMessage) => void;
  onEdit: (message: ClientMessage) => void;
  onDelete: (message: ClientMessage) => void;
  onRetry: (clientMessageId: string) => void;
}

export function MessageList({
  messages,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
  conversationId,
  currentUserId,
  members,
  isGroup,
  showTyping,
  onReply,
  onEdit,
  onDelete,
  onRetry,
}: MessageListProps) {
  const profiles = useProfilesStore((s) => s.profiles);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const prevScrollHeight = React.useRef(0);
  const lastMessageId = messages[messages.length - 1]?.id;

  // Auto-scroll to bottom on new messages when the user is near the bottom.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 200) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId, showTyping]);

  // Preserve scroll position when older messages are prepended.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (loadingMore) {
      prevScrollHeight.current = container.scrollHeight;
    } else if (prevScrollHeight.current > 0) {
      const diff = container.scrollHeight - prevScrollHeight.current;
      if (diff > 0) container.scrollTop = diff;
      prevScrollHeight.current = 0;
    }
  }, [loadingMore, messages.length]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollTop < 80 && hasMore && !loadingMore) {
      onLoadMore();
    }
  };

  const findReplyPreview = (replyToId: string | null) => {
    if (!replyToId) return null;
    const target = messages.find((m) => m.id === replyToId);
    if (!target) return null;
    const name =
      target.senderId === currentUserId
        ? "You"
        : (profiles[target.senderId]?.name ?? "Unknown");
    const text =
      target.deletedAt !== null
        ? "Deleted message"
        : target.text ||
          (target.type === "image"
            ? "Photo"
            : target.type === "video"
              ? "Video"
              : target.type === "audio"
                ? "Voice message"
                : "Attachment");
    return { name, text };
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 overflow-hidden p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <Skeleton
              className="h-12 rounded-2xl"
              style={{ width: `${120 + ((i * 37) % 160)}px` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-lg font-medium">No messages yet</p>
        <p className="text-sm text-muted-foreground">
          Say hello and start the conversation.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto py-3 scrollbar-thin"
    >
      {loadingMore ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {messages.map((message, index) => {
        const prev = messages[index - 1];
        const isOwn = message.senderId === currentUserId;
        const showDaySeparator =
          !prev || isDifferentDay(prev.createdAt, message.createdAt);
        const sameSenderAsPrev =
          prev &&
          prev.senderId === message.senderId &&
          !isDifferentDay(prev.createdAt, message.createdAt);
        const next = messages[index + 1];
        const sameSenderAsNext =
          next && next.senderId === message.senderId;

        const status = isOwn
          ? computeOwnMessageStatus(message, currentUserId, members)
          : "seen";

        return (
          <React.Fragment key={message.id}>
            {showDaySeparator ? (
              <div className="my-3 flex justify-center">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                  {formatDaySeparator(message.createdAt)}
                </span>
              </div>
            ) : null}
            <MessageBubble
              message={message}
              isOwn={isOwn}
              status={status}
              conversationId={conversationId}
              currentUserId={currentUserId}
              sender={profiles[message.senderId] ?? null}
              showAvatar={!isOwn && !sameSenderAsNext}
              showName={isGroup && !isOwn && !sameSenderAsPrev}
              repliedPreview={findReplyPreview(message.replyToId)}
              onReply={() => onReply(message)}
              onEdit={() => onEdit(message)}
              onDelete={() => onDelete(message)}
              onRetry={() => onRetry(message.clientMessageId)}
            />
          </React.Fragment>
        );
      })}

      {showTyping ? <TypingBubble /> : null}
      <div ref={bottomRef} />
    </div>
  );
}
