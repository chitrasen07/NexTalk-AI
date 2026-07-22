"use client";

import * as React from "react";
import {
  Copy,
  CornerUpLeft,
  MoreVertical,
  Pencil,
  RotateCw,
  SmilePlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatar } from "@/components/chat/user-avatar";
import { MessageStatusTicks } from "@/components/chat/message-status";
import { MessageAttachmentView } from "@/components/chat/message-attachment";
import { cn, stringToColor } from "@/lib/utils";
import { formatMessageTime } from "@/lib/datetime";
import { toggleReaction } from "@/lib/chat/messages";
import { useReactions } from "@/hooks/use-reactions";
import type { ClientMessage, MessageStatus, UserProfile } from "@/types";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface MessageBubbleProps {
  message: ClientMessage;
  isOwn: boolean;
  status: MessageStatus;
  conversationId: string;
  currentUserId: string;
  sender: UserProfile | null;
  showAvatar: boolean;
  showName: boolean;
  repliedPreview: { name: string; text: string } | null;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRetry: () => void;
}

export function MessageBubble({
  message,
  isOwn,
  status,
  conversationId,
  currentUserId,
  sender,
  showAvatar,
  showName,
  repliedPreview,
  onReply,
  onEdit,
  onDelete,
  onRetry,
}: MessageBubbleProps) {
  const isReal = !message.id.startsWith("c_");
  const reactions = useReactions(conversationId, message.id, isReal);
  const isDeleted = message.deletedAt !== null;

  const grouped = React.useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean }>();
    for (const r of reactions) {
      const entry = map.get(r.emoji) ?? { count: 0, mine: false };
      entry.count += 1;
      if (r.userId === currentUserId) entry.mine = true;
      map.set(r.emoji, entry);
    }
    return Array.from(map.entries());
  }, [reactions, currentUserId]);

  const react = async (emoji: string) => {
    if (!isReal) return;
    const mine = reactions.find((r) => r.userId === currentUserId) ?? null;
    try {
      await toggleReaction(conversationId, message.id, currentUserId, emoji, mine);
    } catch {
      toast.error("Couldn't update reaction.");
    }
  };

  const copyText = () => {
    void navigator.clipboard.writeText(message.text);
    toast.success("Message copied");
  };

  return (
    <div
      className={cn(
        "group flex w-full gap-2 px-4 py-0.5",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div className="w-8 shrink-0">
        {!isOwn && showAvatar ? (
          <UserAvatar
            name={sender?.name}
            photoURL={sender?.photoURL}
            className="h-8 w-8 text-xs"
          />
        ) : null}
      </div>

      <div
        className={cn(
          "flex max-w-[75%] flex-col sm:max-w-[65%]",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div className="relative">
          <div
            className={cn(
              "relative rounded-2xl px-3.5 py-2 text-sm shadow-sm",
              isOwn
                ? "rounded-br-md brand-gradient text-white"
                : "rounded-bl-md bg-secondary text-foreground",
              status === "failed" && "opacity-70 ring-1 ring-destructive",
            )}
          >
            {!isOwn && showName ? (
              <p
                className="mb-0.5 text-xs font-semibold"
                style={{ color: stringToColor(message.senderId) }}
              >
                {sender?.name ?? "Unknown"}
              </p>
            ) : null}

            {repliedPreview ? (
              <div
                className={cn(
                  "mb-1 rounded-md border-l-2 px-2 py-1 text-xs",
                  isOwn
                    ? "border-white/60 bg-white/15"
                    : "border-primary bg-background/50",
                )}
              >
                <p className="font-medium">{repliedPreview.name}</p>
                <p className="line-clamp-2 opacity-80">{repliedPreview.text}</p>
              </div>
            ) : null}

            {isDeleted ? (
              <p className="italic opacity-70">This message was deleted</p>
            ) : (
              <>
                {message.attachment ? (
                  <div className={cn(message.text && "mb-1.5")}>
                    <MessageAttachmentView
                      type={message.type}
                      attachment={message.attachment}
                    />
                  </div>
                ) : null}
                {message.text ? (
                  <p className="whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                ) : null}
              </>
            )}

            <div
              className={cn(
                "mt-0.5 flex items-center justify-end gap-1 text-[10px]",
                isOwn ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {message.editedAt && !isDeleted ? <span>edited</span> : null}
              <span>{formatMessageTime(message.createdAt)}</span>
              {isOwn ? <MessageStatusTicks status={status} /> : null}
            </div>
          </div>

          {/* Hover actions */}
          {!isDeleted ? (
            <div
              className={cn(
                "absolute top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
                isOwn ? "right-full mr-1" : "left-full ml-1",
              )}
            >
              {isReal ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground shadow hover:text-foreground"
                      aria-label="Add reaction"
                    >
                      <SmilePlus className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-1.5" align="center">
                    <div className="flex gap-1">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => void react(emoji)}
                          className="rounded-md p-1 text-lg transition-transform hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : null}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground shadow hover:text-foreground"
                    aria-label="Message actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "end" : "start"}>
                  {isReal ? (
                    <DropdownMenuItem onClick={onReply}>
                      <CornerUpLeft className="h-4 w-4" />
                      Reply
                    </DropdownMenuItem>
                  ) : null}
                  {message.text ? (
                    <DropdownMenuItem onClick={copyText}>
                      <Copy className="h-4 w-4" />
                      Copy
                    </DropdownMenuItem>
                  ) : null}
                  {isOwn && isReal && message.type === "text" ? (
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  ) : null}
                  {isOwn && isReal ? (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  ) : null}
                  {status === "failed" ? (
                    <DropdownMenuItem onClick={onRetry}>
                      <RotateCw className="h-4 w-4" />
                      Retry
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>

        {grouped.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {grouped.map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                onClick={() => void react(emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
                  mine
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary",
                )}
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground">{count}</span>
              </button>
            ))}
          </div>
        ) : null}

        {status === "failed" ? (
          <button
            onClick={onRetry}
            className="mt-1 flex items-center gap-1 text-xs text-destructive hover:underline"
          >
            <RotateCw className="h-3 w-3" />
            Failed to send — tap to retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
