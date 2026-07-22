import OpenAI from "openai";
import { defineSecret } from "firebase-functions/params";

/**
 * The OpenAI API key is stored as a Firebase secret and is NEVER exposed to the
 * client. Set it with: `firebase functions:secrets:set OPENAI_API_KEY`.
 */
export const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

export const CHAT_MODEL = "gpt-4o-mini";
export const EMBEDDING_MODEL = "text-embedding-3-small";

export function getOpenAI(): OpenAI | null {
  const key = OPENAI_API_KEY.value();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/** Run a chat completion and return the trimmed text (or null if no key). */
export async function chatComplete(
  system: string,
  user: string,
  options: { temperature?: number; maxTokens?: number } = {},
): Promise<string | null> {
  const client = getOpenAI();
  if (!client) return null;
  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 400,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? null;
}
