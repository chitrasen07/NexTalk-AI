import { MessagesSquare } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl brand-gradient shadow-xl shadow-primary/25">
        <MessagesSquare className="h-10 w-10 text-white" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Welcome to ChatSphere AI</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Select a conversation from the sidebar or start a new chat to begin
          messaging with AI-powered superpowers.
        </p>
      </div>
    </div>
  );
}
