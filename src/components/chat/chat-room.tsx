"use client";

import * as React from "react";
import { MessageCircleOff } from "lucide-react";
import { toast } from "sonner";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageComposer } from "@/components/chat/message-composer";
import { SmartReplies } from "@/components/chat/smart-replies";
import { AIPanel } from "@/components/chat/ai-panel";
import { LoadingScreen } from "@/components/loading-screen";
import {
  useConversation,
  useConversationMembers,
} from "@/hooks/use-conversations";
import { useMessages } from "@/hooks/use-messages";
import { useTyping } from "@/hooks/use-typing";
import { useAuth } from "@/contexts/auth-context";
import { useChatStore } from "@/store/chat-store";
import { useProfilesStore } from "@/store/profiles-store";
import {
  markConversationRead,
  markDelivered as markMemberDelivered,
} from "@/lib/chat/conversations";
import { deleteMessage, markSeen } from "@/lib/chat/messages";
import {
  formatTypingLabel,
  getConversationDisplay,
} from "@/lib/chat/helpers";
import { getFriendlyErrorMessage } from "@/lib/firebase/errors";
import type { ClientMessage } from "@/types";

export function ChatRoom({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const { conversation, loading: convLoading, notFound } =
    useConversation(conversationId);
  const members = useConversationMembers(conversationId);
  const profiles = useProfilesStore((s) => s.profiles);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setReplyTarget = useChatStore((s) => s.setReplyTarget);
  const setEditTarget = useChatStore((s) => s.setEditTarget);

  const { messages, loading, hasMore, loadingMore, loadMore, send, retry } =
    useMessages(conversationId, uid);

  const { typingUserIds, notifyTyping, stopTyping } = useTyping(
    conversationId,
    uid,
  );

  React.useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

  // Mark delivered + read/seen when new messages arrive while viewing.
  const lastMessage = messages[messages.length - 1] ?? null;
  React.useEffect(() => {
    if (!uid || !conversationId || messages.length === 0) return;
    const serverMessages = messages.filter((m) => !m.id.startsWith("c_"));
    if (serverMessages.length === 0) return;
    const latest = serverMessages[serverMessages.length - 1]!;

    void markMemberDelivered(conversationId, uid).catch(() => undefined);

    if (latest.senderId !== uid) {
      void markConversationRead(conversationId, uid, latest.id).catch(
        () => undefined,
      );
      const unseenIncoming = serverMessages
        .filter((m) => m.senderId !== uid)
        .map((m) => m.id);
      void markSeen(conversationId, unseenIncoming, uid).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage?.id, conversationId, uid]);

  if (convLoading) {
    return <LoadingScreen message="Opening conversation…" />;
  }

  if (notFound || !conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <MessageCircleOff className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">Conversation not found</p>
        <p className="text-sm text-muted-foreground">
          It may have been deleted or you don&apos;t have access.
        </p>
      </div>
    );
  }

  const display = getConversationDisplay(conversation, uid, profiles);
  const typingLabel = formatTypingLabel(typingUserIds, profiles);

  const handleReply = (message: ClientMessage) => {
    const senderName =
      message.senderId === uid
        ? "yourself"
        : (profiles[message.senderId]?.name ?? "Unknown");
    setReplyTarget({
      messageId: message.id,
      senderName,
      preview:
        message.text ||
        (message.type === "image"
          ? "Photo"
          : message.type === "video"
            ? "Video"
            : message.type === "audio"
              ? "Voice message"
              : "Attachment"),
    });
  };

  const handleEdit = (message: ClientMessage) => {
    setEditTarget({ messageId: message.id, text: message.text });
  };

  const handleDelete = async (message: ClientMessage) => {
    try {
      await deleteMessage(conversationId, message.id);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatHeader
          conversation={conversation}
          title={display.title}
          photoURL={display.photoURL}
          otherUserId={display.otherUserId}
          subtitle={display.subtitle}
          typingLabel={typingLabel}
        />

        <MessageList
          messages={messages}
          loading={loading}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          conversationId={conversationId}
          currentUserId={uid}
          members={members}
          isGroup={conversation.type === "group"}
          showTyping={typingUserIds.length > 0}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={(m) => void handleDelete(m)}
          onRetry={retry}
        />

        <SmartReplies
          conversationId={conversationId}
          lastMessage={lastMessage}
          currentUserId={uid}
          onPick={(reply) => void send({ text: reply, type: "text" })}
        />

        <MessageComposer
          conversationId={conversationId}
          onSend={send}
          onTyping={notifyTyping}
          onStopTyping={stopTyping}
        />
      </div>

      <AIPanel conversationId={conversationId} />
    </div>
  );
}
