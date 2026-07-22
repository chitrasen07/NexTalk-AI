import { Logo } from "@/components/logo";

export function LoadingScreen({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <div className="animate-fade-in">
        <Logo size="lg" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 animate-typing-bounce rounded-full bg-primary [animation-delay:-0.32s]" />
        <span className="h-2 w-2 animate-typing-bounce rounded-full bg-primary [animation-delay:-0.16s]" />
        <span className="h-2 w-2 animate-typing-bounce rounded-full bg-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
