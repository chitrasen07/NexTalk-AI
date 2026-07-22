"use client";

import * as React from "react";
import {
  FileText,
  ImageIcon,
  Loader2,
  Mic,
  Paperclip,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/chat-store";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { editMessage } from "@/lib/chat/messages";
import {
  uploadConversationAudio,
  uploadConversationFile,
  uploadConversationImage,
  uploadConversationVideo,
  validateFile,
  type UploadResult,
} from "@/lib/firebase/storage";
import { callRewriteMessage } from "@/lib/firebase/functions";
import { getFriendlyErrorMessage } from "@/lib/firebase/errors";
import type { MessageAttachment, MessageType } from "@/types";

interface MessageComposerProps {
  conversationId: string;
  onSend: (input: {
    text: string;
    type?: MessageType;
    attachment?: MessageAttachment | null;
    replyToId?: string | null;
  }) => Promise<void>;
  onTyping: () => void;
  onStopTyping: () => void;
}

interface PendingUpload {
  file: File;
  type: MessageType;
  progress: number;
}

export function MessageComposer({
  conversationId,
  onSend,
  onTyping,
  onStopTyping,
}: MessageComposerProps) {
  const [text, setText] = React.useState("");
  const [rewriting, setRewriting] = React.useState(false);
  const [upload, setUpload] = React.useState<PendingUpload | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const replyTarget = useChatStore((s) => s.replyTarget);
  const editTarget = useChatStore((s) => s.editTarget);
  const setReplyTarget = useChatStore((s) => s.setReplyTarget);
  const setEditTarget = useChatStore((s) => s.setEditTarget);

  const recorder = useVoiceRecorder();

  // Populate text when entering edit mode.
  React.useEffect(() => {
    if (editTarget) {
      setText(editTarget.text);
      textareaRef.current?.focus();
    }
  }, [editTarget]);

  // Auto-grow the textarea.
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const resetComposer = () => {
    setText("");
    setReplyTarget(null);
    setEditTarget(null);
    onStopTyping();
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editTarget) {
      try {
        await editMessage(conversationId, editTarget.messageId, trimmed);
        toast.success("Message edited");
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      }
      resetComposer();
      return;
    }

    const replyToId = replyTarget?.messageId ?? null;
    resetComposer();
    await onSend({ text: trimmed, type: "text", replyToId });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const uploaderFor = (type: MessageType) => {
    switch (type) {
      case "image":
        return uploadConversationImage;
      case "video":
        return uploadConversationVideo;
      case "audio":
        return uploadConversationAudio;
      default:
        return uploadConversationFile;
    }
  };

  const handleFileSelected = async (file: File, type: MessageType) => {
    const kind = type === "file" ? "file" : type;
    const validationError = validateFile(
      file,
      kind as "image" | "video" | "audio" | "file",
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUpload({ file, type, progress: 0 });
    try {
      const result: UploadResult = await uploaderFor(type)(
        conversationId,
        file,
        {
          onProgress: (p) =>
            setUpload((prev) => (prev ? { ...prev, progress: p } : prev)),
        },
      );
      const attachment: MessageAttachment = {
        url: result.url,
        name: result.name,
        contentType: result.contentType,
        size: result.size,
      };
      const replyToId = replyTarget?.messageId ?? null;
      setReplyTarget(null);
      await onSend({ text: "", type, attachment, replyToId });
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setUpload(null);
    }
  };

  const handleRewrite = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRewriting(true);
    try {
      const res = await callRewriteMessage({ text: trimmed, tone: "friendly" });
      setText(res.data.text);
    } catch {
      toast.error("AI rewrite is unavailable. Deploy Cloud Functions first.");
    } finally {
      setRewriting(false);
    }
  };

  const handleStopRecording = async () => {
    const file = await recorder.stop();
    if (file) await handleFileSelected(file, "audio");
  };

  return (
    <div className="border-t bg-card/40 px-3 py-2.5">
      {replyTarget ? (
        <div className="mb-2 flex items-center justify-between rounded-lg border-l-2 border-primary bg-secondary/60 px-3 py-1.5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary">
              Replying to {replyTarget.senderName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {replyTarget.preview}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setReplyTarget(null)}
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {editTarget ? (
        <div className="mb-2 flex items-center justify-between rounded-lg border-l-2 border-amber-500 bg-secondary/60 px-3 py-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Pencil className="h-3 w-3" /> Editing message
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditTarget(null);
              setText("");
            }}
            aria-label="Cancel edit"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {upload ? (
        <div className="mb-2 rounded-lg bg-secondary/60 px-3 py-2">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate">Uploading {upload.file.name}</span>
            <span className="text-muted-foreground">{upload.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full brand-gradient transition-all"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {recorder.isRecording ? (
        <div className="flex items-center gap-3 rounded-full bg-secondary px-4 py-2">
          <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
          <span className="flex-1 text-sm font-medium">
            Recording… {Math.floor(recorder.seconds / 60)}:
            {String(recorder.seconds % 60).padStart(2, "0")}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={recorder.cancel}
            aria-label="Cancel recording"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button
            variant="brand"
            size="icon-sm"
            onClick={() => void handleStopRecording()}
            aria-label="Send recording"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-end gap-1">
          <EmojiPicker onSelect={(emoji) => setText((t) => t + emoji)} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Attach file"
                disabled={!!upload}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
              <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                <ImageIcon className="h-4 w-4" /> Photo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => videoInputRef.current?.click()}>
                <Video className="h-4 w-4" /> Video
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileText className="h-4 w-4" /> Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                onTyping();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              className="max-h-40 min-h-[40px] resize-none rounded-2xl py-2.5 pr-10"
              aria-label="Message"
            />
            {text.trim() ? (
              <button
                type="button"
                onClick={() => void handleRewrite()}
                disabled={rewriting}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
                aria-label="AI rewrite"
                title="AI rewrite"
              >
                {rewriting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </button>
            ) : null}
          </div>

          {text.trim() ? (
            <Button
              variant="brand"
              size="icon"
              onClick={() => void handleSend()}
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void recorder.start()}
              aria-label="Record voice message"
              disabled={!!upload}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileSelected(file, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileSelected(file, "video");
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileSelected(file, "file");
          e.target.value = "";
        }}
      />
    </div>
  );
}
