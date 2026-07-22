import { ChatRoom } from "@/components/chat/chat-room";

export default function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  return <ChatRoom conversationId={params.conversationId} />;
}
