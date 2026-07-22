import { create } from "zustand";
import type { Message } from "@/types";

export interface ReplyTarget {
  messageId: string;
  senderName: string;
  preview: string;
}

export interface EditTarget {
  messageId: string;
  text: string;
}

export interface UploadState {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "done" | "error" | "cancelled";
  error?: string;
}

interface ChatStore {
  activeConversationId: string | null;
  replyTarget: ReplyTarget | null;
  editTarget: EditTarget | null;
  drafts: Record<string, string>;
  aiPanelOpen: boolean;
  sidebarOpen: boolean;
  uploads: Record<string, UploadState>;

  setActiveConversation: (id: string | null) => void;
  setReplyTarget: (target: ReplyTarget | null) => void;
  setEditTarget: (target: EditTarget | null) => void;
  setDraft: (conversationId: string, text: string) => void;
  clearDraft: (conversationId: string) => void;
  toggleAIPanel: (open?: boolean) => void;
  toggleSidebar: (open?: boolean) => void;
  setUpload: (upload: UploadState) => void;
  removeUpload: (id: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeConversationId: null,
  replyTarget: null,
  editTarget: null,
  drafts: {},
  aiPanelOpen: false,
  sidebarOpen: true,
  uploads: {},

  setActiveConversation: (id) =>
    set({ activeConversationId: id, replyTarget: null, editTarget: null }),
  setReplyTarget: (target) => set({ replyTarget: target, editTarget: null }),
  setEditTarget: (target) => set({ editTarget: target, replyTarget: null }),
  setDraft: (conversationId, text) =>
    set((state) => ({ drafts: { ...state.drafts, [conversationId]: text } })),
  clearDraft: (conversationId) =>
    set((state) => {
      const drafts = { ...state.drafts };
      delete drafts[conversationId];
      return { drafts };
    }),
  toggleAIPanel: (open) =>
    set((state) => ({ aiPanelOpen: open ?? !state.aiPanelOpen })),
  toggleSidebar: (open) =>
    set((state) => ({ sidebarOpen: open ?? !state.sidebarOpen })),
  setUpload: (upload) =>
    set((state) => ({ uploads: { ...state.uploads, [upload.id]: upload } })),
  removeUpload: (id) =>
    set((state) => {
      const uploads = { ...state.uploads };
      delete uploads[id];
      return { uploads };
    }),
}));

export type { Message };
