import { MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-base" },
  md: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-lg" },
  lg: { box: "h-14 w-14", icon: "h-7 w-7", text: "text-2xl" },
} as const;

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl brand-gradient shadow-lg shadow-primary/25",
          s.box,
        )}
      >
        <MessagesSquare className={cn("text-white", s.icon)} />
      </div>
      {showText ? (
        <span className={cn("font-bold tracking-tight", s.text)}>
          NexTalk <span className="brand-text-gradient">AI</span>
        </span>
      ) : null}
    </div>
  );
}
