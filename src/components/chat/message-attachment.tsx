"use client";

import * as React from "react";
import { Download, FileText, Play } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { MessageAttachment as Attachment, MessageType } from "@/types";

interface MessageAttachmentViewProps {
  type: MessageType;
  attachment: Attachment;
}

export function MessageAttachmentView({
  type,
  attachment,
}: MessageAttachmentViewProps) {
  if (type === "image") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-80 w-full max-w-xs rounded-lg object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (type === "video") {
    return (
      <video
        src={attachment.url}
        controls
        className="max-h-80 w-full max-w-xs rounded-lg"
      >
        <track kind="captions" />
      </video>
    );
  }

  if (type === "audio") {
    return (
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4 shrink-0" />
        <audio src={attachment.url} controls className="h-9 max-w-[220px]" />
      </div>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border bg-background/40 p-2.5"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(attachment.size)}
        </p>
      </div>
      <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
    </a>
  );
}
