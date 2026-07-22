import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  OPENAI_API_KEY,
  EMBEDDING_MODEL,
  chatComplete,
  getOpenAI,
} from "./openai";
import {
  assertConversationMember,
  buildTranscript,
  fetchRecentMessages,
} from "./util";

const callOpts = { secrets: [OPENAI_API_KEY], cors: true };

/** Heuristic replies used when no OpenAI key is configured. */
function fallbackReplies(): string[] {
  return ["Sounds good!", "Got it, thanks 👍", "Let me get back to you."];
}

export const generateSmartReplies = onCall(callOpts, async (request) => {
  const { conversationId, messageText } = request.data as {
    conversationId: string;
    messageText: string;
  };
  await assertConversationMember(request.auth?.uid, conversationId);

  const result = await chatComplete(
    "You generate 3 short, natural chat reply suggestions. " +
      "Return ONLY a JSON array of 3 strings, no prose.",
    `The other person said: "${messageText}". Suggest 3 brief replies.`,
    { temperature: 0.8, maxTokens: 120 },
  );

  if (!result) return { replies: fallbackReplies() };

  try {
    const match = result.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : result) as string[];
    return { replies: parsed.slice(0, 3) };
  } catch {
    return { replies: fallbackReplies() };
  }
});

export const rewriteMessage = onCall(callOpts, async (request) => {
  const { text, tone } = request.data as { text: string; tone: string };
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const toneInstruction: Record<string, string> = {
    professional: "Rewrite in a polished, professional tone.",
    friendly: "Rewrite in a warm, friendly tone.",
    concise: "Rewrite to be as concise as possible while keeping meaning.",
    expanded: "Expand with a little more detail and warmth.",
    grammar: "Fix grammar and spelling only; keep the tone and meaning.",
  };
  const result = await chatComplete(
    "You are an expert writing assistant. Return ONLY the rewritten text.",
    `${toneInstruction[tone] ?? toneInstruction.friendly}\n\nText: "${text}"`,
    { temperature: 0.6, maxTokens: 300 },
  );
  if (!result) {
    throw new HttpsError("failed-precondition", "AI is not configured.");
  }
  return { text: result.replace(/^["']|["']$/g, "") };
});

export const summarizeConversation = onCall(callOpts, async (request) => {
  const { conversationId, messageCount } = request.data as {
    conversationId: string;
    messageCount?: number;
  };
  await assertConversationMember(request.auth?.uid, conversationId);

  const messages = await fetchRecentMessages(
    conversationId,
    messageCount ?? 50,
  );
  const transcript = await buildTranscript(conversationId, messages);
  if (!transcript) return { summary: "There are no messages to summarize yet." };

  const result = await chatComplete(
    "You summarize chat conversations into concise bullet points highlighting " +
      "key topics, decisions and any action items.",
    `Summarize this conversation:\n\n${transcript}`,
    { temperature: 0.4, maxTokens: 300 },
  );
  if (!result) {
    throw new HttpsError("failed-precondition", "AI is not configured.");
  }
  return { summary: result };
});

export const translateMessage = onCall(callOpts, async (request) => {
  const { text, targetLanguage } = request.data as {
    text: string;
    targetLanguage: string;
  };
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const result = await chatComplete(
    "You are a professional translator. Return ONLY the translated text.",
    `Translate the following into ${targetLanguage}:\n\n"${text}"`,
    { temperature: 0.3, maxTokens: 400 },
  );
  if (!result) {
    throw new HttpsError("failed-precondition", "AI is not configured.");
  }
  return { text: result.replace(/^["']|["']$/g, "") };
});

export const askConversationAI = onCall(callOpts, async (request) => {
  const { conversationId, question } = request.data as {
    conversationId: string;
    question: string;
  };
  await assertConversationMember(request.auth?.uid, conversationId);

  const messages = await fetchRecentMessages(conversationId, 60);
  const transcript = await buildTranscript(conversationId, messages);

  const result = await chatComplete(
    "You are a helpful assistant that answers questions about a chat " +
      "conversation. Use only the provided transcript. If the answer isn't " +
      "there, say so.",
    `Transcript:\n${transcript}\n\nQuestion: ${question}`,
    { temperature: 0.4, maxTokens: 400 },
  );
  if (!result) {
    throw new HttpsError("failed-precondition", "AI is not configured.");
  }
  return { answer: result };
});

export const moderateMessage = onCall(callOpts, async (request) => {
  const { text } = request.data as { text: string };
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const client = getOpenAI();
  if (!client) return { flagged: false, categories: [] };

  const moderation = await client.moderations.create({
    model: "omni-moderation-latest",
    input: text,
  });
  const result = moderation.results[0];
  const categories = result
    ? Object.entries(result.categories)
        .filter(([, flagged]) => flagged)
        .map(([category]) => category)
    : [];
  return { flagged: result?.flagged ?? false, categories };
});

export const transcribeVoiceMessage = onCall(callOpts, async (request) => {
  const { audioUrl } = request.data as { audioUrl: string };
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const client = getOpenAI();
  if (!client) {
    throw new HttpsError("failed-precondition", "AI is not configured.");
  }
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new HttpsError("invalid-argument", "Could not fetch the audio file.");
  }
  const arrayBuffer = await response.arrayBuffer();
  const file = new File([arrayBuffer], "voice.webm", { type: "audio/webm" });
  const transcription = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });
  return { transcript: transcription.text };
});

/** Create an embedding vector for arbitrary text (semantic search / RAG). */
export const createEmbedding = onCall(callOpts, async (request) => {
  const { text } = request.data as { text: string };
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const client = getOpenAI();
  if (!client) {
    throw new HttpsError("failed-precondition", "AI is not configured.");
  }
  const embedding = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return { embedding: embedding.data[0]?.embedding ?? [] };
});
