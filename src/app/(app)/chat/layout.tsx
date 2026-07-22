"use client";

import { usePathname } from "next/navigation";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { cn } from "@/lib/utils";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hasActiveConversation = /^\/chat\/.+/.test(pathname);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div
        className={cn(
          "w-full md:flex md:w-80 md:shrink-0 lg:w-96",
          hasActiveConversation ? "hidden md:flex" : "flex",
        )}
      >
        <ChatSidebar />
      </div>
      <main
        className={cn(
          "min-w-0 flex-1 flex-col",
          hasActiveConversation ? "flex" : "hidden md:flex",
        )}
      >
        {children}
      </main>
    </div>
  );
}
