"use client";

import { AlertCircle, Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageStatus } from "@/types";

export function MessageStatusTicks({ status }: { status: MessageStatus }) {
  switch (status) {
    case "pending":
      return <Clock className="h-3.5 w-3.5 text-primary-foreground/60" />;
    case "failed":
      return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    case "sent":
      return <Check className="h-3.5 w-3.5 text-primary-foreground/70" />;
    case "delivered":
      return (
        <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />
      );
    case "seen":
      return <CheckCheck className={cn("h-3.5 w-3.5 text-sky-300")} />;
    default:
      return null;
  }
}
