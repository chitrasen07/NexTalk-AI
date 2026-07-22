"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCheck,
  FileUp,
  Languages,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";

const features = [
  {
    icon: Zap,
    title: "Real-time messaging",
    description:
      "Instant delivery with Firestore listeners, optimistic sending and duplicate protection.",
  },
  {
    icon: Wifi,
    title: "Presence & typing",
    description:
      "Live online status, last-seen and typing indicators via Realtime Database.",
  },
  {
    icon: CheckCheck,
    title: "Read receipts",
    description: "Sent, delivered and seen ticks — accurate even in group chats.",
  },
  {
    icon: Bot,
    title: "AI copilots",
    description:
      "Smart replies, rewrites, summaries and a conversation assistant.",
  },
  {
    icon: FileUp,
    title: "Rich media",
    description:
      "Share images, videos, documents and voice notes with upload progress.",
  },
  {
    icon: Languages,
    title: "Translation",
    description: "Break language barriers with one-tap message translation.",
  },
  {
    icon: Users,
    title: "Group chats",
    description: "Create groups, manage members and stay organized.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description: "Hardened Firebase rules and server-side AI keys.",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const primaryHref = user ? "/chat" : "/register";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b glass">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loading ? null : user ? (
              <Button asChild variant="brand">
                <Link href="/chat">
                  Open app <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild variant="brand">
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center gap-6 py-20 text-center md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            Powered by Firebase &amp; AI
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            Real-time messaging,{" "}
            <span className="brand-text-gradient">supercharged with AI</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            NexTalk AI is a premium chat platform with live presence, read
            receipts, media sharing and built-in AI copilots — all on a secure,
            scalable Firebase backend.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="brand">
              <Link href={primaryHref}>
                {user ? "Open NexTalk" : "Start chatting free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="container pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:brand-gradient group-hover:text-white">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="container pb-24">
          <div className="relative overflow-hidden rounded-3xl brand-gradient p-10 text-center text-white md:p-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 30%, white 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            />
            <div className="relative mx-auto max-w-2xl space-y-6">
              <MessagesSquare className="mx-auto h-12 w-12" />
              <h2 className="text-3xl font-bold sm:text-4xl">
                Ready to chat smarter?
              </h2>
              <p className="text-white/80">
                Create your free account and experience the future of messaging.
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link href={primaryHref}>
                  {user ? "Open NexTalk" : "Get started now"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} NexTalk AI. Built with Firebase.</p>
        </div>
      </footer>
    </div>
  );
}
