import * as admin from "firebase-admin";

admin.initializeApp();

export {
  generateSmartReplies,
  rewriteMessage,
  summarizeConversation,
  translateMessage,
  askConversationAI,
  moderateMessage,
  transcribeVoiceMessage,
  createEmbedding,
} from "./ai";

export { onMessageCreated } from "./notifications";
