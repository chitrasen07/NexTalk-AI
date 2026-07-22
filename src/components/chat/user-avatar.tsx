"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

interface UserAvatarProps {
  name: string | null | undefined;
  photoURL?: string | null;
  online?: boolean;
  showPresence?: boolean;
  className?: string;
}

export function UserAvatar({
  name,
  photoURL,
  online = false,
  showPresence = false,
  className,
}: UserAvatarProps) {
  return (
    <div className="relative shrink-0">
      <Avatar className={cn("h-10 w-10", className)}>
        {photoURL ? <AvatarImage src={photoURL} alt={name ?? "User"} /> : null}
        <AvatarFallback className="brand-gradient text-white">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showPresence ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background transition-colors",
            online ? "bg-emerald-500" : "bg-muted-foreground/40",
          )}
          aria-label={online ? "Online" : "Offline"}
        />
      ) : null}
    </div>
  );
}
