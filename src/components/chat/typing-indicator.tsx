"use client";

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-typing-bounce rounded-full bg-current [animation-delay:-0.32s]" />
      <span className="h-1.5 w-1.5 animate-typing-bounce rounded-full bg-current [animation-delay:-0.16s]" />
      <span className="h-1.5 w-1.5 animate-typing-bounce rounded-full bg-current" />
    </span>
  );
}

export function TypingBubble() {
  return (
    <div className="flex justify-start px-4 py-1">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-secondary px-4 py-3 text-muted-foreground">
        <TypingDots />
      </div>
    </div>
  );
}
