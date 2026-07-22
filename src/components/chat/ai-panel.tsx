"use client";

import * as React from "react";
import { Bot, Loader2, ScrollText, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useChatStore } from "@/store/chat-store";
import {
  callAskConversationAI,
  callSummarizeConversation,
} from "@/lib/firebase/functions";

interface AIPanelProps {
  conversationId: string;
}

interface QA {
  question: string;
  answer: string;
}

export function AIPanel({ conversationId }: AIPanelProps) {
  const open = useChatStore((s) => s.aiPanelOpen);
  const toggleAIPanel = useChatStore((s) => s.toggleAIPanel);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [summarizing, setSummarizing] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [asking, setAsking] = React.useState(false);
  const [history, setHistory] = React.useState<QA[]>([]);

  const summarize = async () => {
    setSummarizing(true);
    try {
      const res = await callSummarizeConversation({ conversationId });
      setSummary(res.data.summary);
    } catch {
      toast.error("AI summary unavailable. Deploy Cloud Functions first.");
    } finally {
      setSummarizing(false);
    }
  };

  const ask = async () => {
    const q = question.trim();
    if (!q) return;
    setAsking(true);
    setQuestion("");
    try {
      const res = await callAskConversationAI({ conversationId, question: q });
      setHistory((prev) => [...prev, { question: q, answer: res.data.answer }]);
    } catch {
      toast.error("AI assistant unavailable. Deploy Cloud Functions first.");
    } finally {
      setAsking(false);
    }
  };

  if (!open) return null;

  return (
    <aside className="flex h-full w-full flex-col border-l bg-card/40 md:w-80">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Copilot</p>
            <p className="text-xs text-muted-foreground">
              Powered by Cloud Functions
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleAIPanel(false)}
          aria-label="Close AI panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => void summarize()}
            disabled={summarizing}
          >
            {summarizing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScrollText className="h-4 w-4" />
            )}
            Summarize conversation
          </Button>
          {summary ? (
            <div className="rounded-lg border bg-background p-3 text-sm">
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> Summary
              </p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {summary}
              </p>
            </div>
          ) : null}
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">Ask about this chat</p>
          {history.map((qa, i) => (
            <div key={i} className="space-y-1.5">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md brand-gradient px-3 py-1.5 text-sm text-white">
                {qa.question}
              </div>
              <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-secondary px-3 py-1.5 text-sm">
                {qa.answer}
              </div>
            </div>
          ))}
          {asking ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void ask();
            }}
            placeholder="Ask the AI…"
            aria-label="Ask the AI"
          />
          <Button
            variant="brand"
            size="icon"
            onClick={() => void ask()}
            disabled={asking || !question.trim()}
            aria-label="Send question"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
