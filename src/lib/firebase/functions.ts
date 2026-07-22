import { getFunctions, httpsCallable, type Functions } from "firebase/functions";
import { firebaseApp } from "./config";

const functions: Functions = getFunctions(firebaseApp);

/* Request/response contracts for the callable Cloud Functions.
   All AI provider calls happen server-side; keys are never exposed here. */

export interface SmartRepliesRequest {
  conversationId: string;
  messageText: string;
}
export interface SmartRepliesResponse {
  replies: string[];
}

export interface RewriteRequest {
  text: string;
  tone: "professional" | "friendly" | "concise" | "expanded" | "grammar";
}
export interface RewriteResponse {
  text: string;
}

export interface SummarizeRequest {
  conversationId: string;
  messageCount?: number;
}
export interface SummarizeResponse {
  summary: string;
}

export interface TranslateRequest {
  text: string;
  targetLanguage: string;
}
export interface TranslateResponse {
  text: string;
}

export interface AskAIRequest {
  conversationId: string;
  question: string;
}
export interface AskAIResponse {
  answer: string;
}

export interface ModerateRequest {
  text: string;
}
export interface ModerateResponse {
  flagged: boolean;
  categories: string[];
}

export interface TranscribeRequest {
  audioUrl: string;
}
export interface TranscribeResponse {
  transcript: string;
}

export const callGenerateSmartReplies = httpsCallable<
  SmartRepliesRequest,
  SmartRepliesResponse
>(functions, "generateSmartReplies");

export const callRewriteMessage = httpsCallable<RewriteRequest, RewriteResponse>(
  functions,
  "rewriteMessage",
);

export const callSummarizeConversation = httpsCallable<
  SummarizeRequest,
  SummarizeResponse
>(functions, "summarizeConversation");

export const callTranslateMessage = httpsCallable<
  TranslateRequest,
  TranslateResponse
>(functions, "translateMessage");

export const callAskConversationAI = httpsCallable<AskAIRequest, AskAIResponse>(
  functions,
  "askConversationAI",
);

export const callModerateMessage = httpsCallable<
  ModerateRequest,
  ModerateResponse
>(functions, "moderateMessage");

export const callTranscribeVoiceMessage = httpsCallable<
  TranscribeRequest,
  TranscribeResponse
>(functions, "transcribeVoiceMessage");

export { functions };
