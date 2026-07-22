import * as React from "react";
import { Bot, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Logo } from "@/components/logo";

const features = [
  {
    icon: Zap,
    title: "Real-time everything",
    description: "Messages, presence and typing sync instantly with Firestore.",
  },
  {
    icon: Bot,
    title: "AI copilots",
    description: "Smart replies, rewrites, summaries and translation built in.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description: "End-to-end auth, hardened rules and private AI keys.",
  },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden overflow-hidden brand-gradient lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative">
          <Logo size="lg" className="[&_span]:text-white" />
        </div>
        <div className="relative space-y-8 text-white">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              The intelligent way to chat
            </div>
            <h1 className="max-w-md text-4xl font-bold leading-tight">
              Conversations, supercharged with AI.
            </h1>
            <p className="max-w-md text-white/80">
              NexTalk AI blends premium real-time messaging with AI copilots,
              all on a secure Firebase backend.
            </p>
          </div>
          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-white/75">{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/60">
          © {new Date().getFullYear()} NexTalk AI. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
