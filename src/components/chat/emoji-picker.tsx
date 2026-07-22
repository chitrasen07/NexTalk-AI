"use client";

import * as React from "react";
import { Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const EMOJI_GROUPS: Record<string, string[]> = {
  Smileys: "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😜 🤪 😝 🤗 🤭 🤫 🤔 😐 😑 😶 🙄 😏 😴 😷 🤒 🤕 😎".split(
    " ",
  ),
  Gestures: "👍 👎 👌 ✌️ 🤞 🤟 🤘 👏 🙌 👐 🤲 🙏 💪 👊 ✊ 🤝 ☝️ 👆 👇 👈 👉 ✋ 🤚 🖐️ 👋".split(
    " ",
  ),
  Hearts: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝".split(" "),
  Objects: "🔥 ⭐ 🎉 🎊 🎁 💯 ✅ ❌ ⚡ 💡 📌 🚀 🏆 🎯 💰 📱 💻 ⏰".split(" "),
};

export function EmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Emoji picker"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" side="top">
        <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin">
          {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
            <div key={group} className="mb-2">
              <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">
                {group}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {emojis.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    type="button"
                    onClick={() => {
                      onSelect(emoji);
                      setOpen(false);
                    }}
                    className="rounded p-1 text-xl transition-transform hover:scale-125 hover:bg-secondary"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
