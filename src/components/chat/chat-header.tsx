"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Info,
  Phone,
  Search,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/chat/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { usePresence } from "@/hooks/use-presence";
import { useChatStore } from "@/store/chat-store";
import { formatLastSeen } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface ChatHeaderProps {
  conversation: Conversation;
  title: string;
  photoURL: string | null;
  otherUserId: string | null;
  subtitle: string | null;
  typingLabel: string | null;
}

export function ChatHeader({
  conversation,
  title,
  photoURL,
  otherUserId,
  subtitle,
  typingLabel,
}: ChatHeaderProps) {
  const presence = usePresence(otherUserId);
  const online = presence?.state === "online";
  const toggleAIPanel = useChatStore((s) => s.toggleAIPanel);

  const statusLine = typingLabel
    ? typingLabel
    : conversation.type === "group"
      ? subtitle
      : online
        ? "online"
        : formatLastSeen(presence?.lastChanged ?? null);

  const notImplemented = (feature: string) =>
    toast.info(`${feature} is coming soon.`);

  return (
    <header className="flex items-center gap-2 border-b bg-card/40 px-3 py-2.5">
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-label="Back to conversations"
      >
        <Link href="/chat">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>

      <UserAvatar
        name={title}
        photoURL={photoURL}
        online={online}
        showPresence={conversation.type === "direct"}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{title}</p>
        <p
          className={cn(
            "truncate text-xs",
            typingLabel ? "text-primary" : "text-muted-foreground",
          )}
        >
          {statusLine}
        </p>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Audio call"
          onClick={() => notImplemented("Audio calls")}
          className="hidden sm:inline-flex"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Video call"
          onClick={() => notImplemented("Video calls")}
          className="hidden sm:inline-flex"
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search in conversation"
          onClick={() => notImplemented("In-chat search")}
          className="hidden sm:inline-flex"
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="AI Copilot"
          onClick={() => toggleAIPanel()}
        >
          <Bot className="h-5 w-5 text-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More options">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleAIPanel(true)}>
              <Bot className="h-4 w-4" /> AI Copilot
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => notImplemented("Contact info")}>
              <Info className="h-4 w-4" /> Conversation info
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => notImplemented("Search")}>
              <Search className="h-4 w-4" /> Search
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
