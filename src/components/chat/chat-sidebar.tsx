"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LogOut,
  MessageSquarePlus,
  Search,
  Settings,
  UserRoundSearch,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/chat/user-avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConversationListItem } from "@/components/chat/conversation-list-item";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useConversations } from "@/hooks/use-conversations";
import { getConversationDisplay } from "@/lib/chat/helpers";
import { useProfilesStore } from "@/store/profiles-store";

type Filter = "chats" | "groups" | "archived";

export function ChatSidebar() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const { conversations, loading } = useConversations(user?.uid ?? null);
  const profiles = useProfilesStore((s) => s.profiles);
  const [filter, setFilter] = React.useState<Filter>("chats");
  const [search, setSearch] = React.useState("");
  const [newChatOpen, setNewChatOpen] = React.useState(false);

  const activeId = pathname.startsWith("/chat/")
    ? pathname.split("/")[2]
    : undefined;

  const filtered = React.useMemo(() => {
    return conversations.filter((c) => {
      if (filter === "groups" && c.type !== "group") return false;
      if (filter === "chats" && c.type !== "direct") return false;
      if (!search.trim()) return true;
      const display = getConversationDisplay(c, user?.uid ?? "", profiles);
      return display.title.toLowerCase().includes(search.toLowerCase());
    });
  }, [conversations, filter, search, user?.uid, profiles]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <aside className="flex h-full w-full flex-col border-r bg-card/40">
      <div className="flex items-center justify-between px-4 py-3">
        <Logo size="sm" />
        <ThemeToggle />
      </div>

      <div className="space-y-2 px-4 pb-3">
        <Button
          variant="brand"
          className="w-full justify-start"
          onClick={() => setNewChatOpen(true)}
        >
          <UserRoundSearch className="h-4 w-4" />
          Find people to chat
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search your chats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search conversations"
          />
        </div>
        {profile?.username ? (
          <p className="text-center text-xs text-muted-foreground">
            Your username:{" "}
            <span className="font-medium text-foreground">
              @{profile.username}
            </span>
          </p>
        ) : null}
      </div>

      <div className="px-4 pb-2">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="w-full">
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserRoundSearch className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No chats yet</p>
              <p className="text-xs text-muted-foreground">
                Find someone by name or @username, then tap{" "}
                <span className="font-medium text-foreground">Chat</span> to
                message them.
              </p>
            </div>
            <Button
              variant="brand"
              size="sm"
              onClick={() => setNewChatOpen(true)}
            >
              <MessageSquarePlus className="h-4 w-4" />
              Find people
            </Button>
          </div>
        ) : (
          filtered.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              currentUserId={user?.uid ?? ""}
              active={conversation.id === activeId}
            />
          ))
        )}
      </div>

      <div className="border-t p-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={profile?.name ?? user?.displayName}
            photoURL={profile?.photoURL ?? user?.photoURL}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {profile?.name ?? user?.displayName ?? "You"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              @{profile?.username ?? "user"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Account menu">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserAvatar
                    name={profile?.name}
                    className="h-4 w-4 text-[8px]"
                  />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ai">
                  <Bot className="h-4 w-4" />
                  AI Studio
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => void handleLogout()}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} />
    </aside>
  );
}
