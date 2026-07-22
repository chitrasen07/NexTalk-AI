"use client";

import * as React from "react";
import { Copy, Languages, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  callRewriteMessage,
  callTranslateMessage,
  type RewriteRequest,
} from "@/lib/firebase/functions";

const TONES: { value: RewriteRequest["tone"]; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
  { value: "expanded", label: "Expanded" },
  { value: "grammar", label: "Fix grammar" },
];

export default function AIStudioPage() {
  const [input, setInput] = React.useState("");
  const [tone, setTone] = React.useState<RewriteRequest["tone"]>("friendly");
  const [rewriting, setRewriting] = React.useState(false);
  const [rewriteResult, setRewriteResult] = React.useState("");

  const [translateInput, setTranslateInput] = React.useState("");
  const [language, setLanguage] = React.useState("Spanish");
  const [translating, setTranslating] = React.useState(false);
  const [translateResult, setTranslateResult] = React.useState("");

  const rewrite = async () => {
    if (!input.trim()) return;
    setRewriting(true);
    try {
      const res = await callRewriteMessage({ text: input.trim(), tone });
      setRewriteResult(res.data.text);
    } catch {
      toast.error("AI rewrite unavailable. Deploy Cloud Functions first.");
    } finally {
      setRewriting(false);
    }
  };

  const translate = async () => {
    if (!translateInput.trim()) return;
    setTranslating(true);
    try {
      const res = await callTranslateMessage({
        text: translateInput.trim(),
        targetLanguage: language,
      });
      setTranslateResult(res.data.text);
    } catch {
      toast.error("AI translation unavailable. Deploy Cloud Functions first.");
    } finally {
      setTranslating(false);
    }
  };

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <PageShell
      title="AI Studio"
      description="Rewrite and translate text with AI copilots."
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" /> Rewrite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to rewrite…"
              rows={4}
            />
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Button
                  key={t.value}
                  variant={tone === t.value ? "brand" : "outline"}
                  size="sm"
                  onClick={() => setTone(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
            <Button
              variant="brand"
              onClick={() => void rewrite()}
              disabled={rewriting || !input.trim()}
            >
              {rewriting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Rewrite
            </Button>
            {rewriteResult ? (
              <div className="rounded-lg border bg-secondary/40 p-3">
                <p className="whitespace-pre-wrap text-sm">{rewriteResult}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => copy(rewriteResult)}
                >
                  <Copy className="h-4 w-4" /> Copy
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" /> Translate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={translateInput}
              onChange={(e) => setTranslateInput(e.target.value)}
              placeholder="Enter text to translate…"
              rows={4}
            />
            <div className="space-y-2">
              <Label htmlFor="language">Target language</Label>
              <Input
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </div>
            <Button
              variant="brand"
              onClick={() => void translate()}
              disabled={translating || !translateInput.trim()}
            >
              {translating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Languages className="h-4 w-4" />
              )}
              Translate
            </Button>
            {translateResult ? (
              <div className="rounded-lg border bg-secondary/40 p-3">
                <p className="whitespace-pre-wrap text-sm">{translateResult}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => copy(translateResult)}
                >
                  <Copy className="h-4 w-4" /> Copy
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
