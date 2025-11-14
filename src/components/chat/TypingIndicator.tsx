"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 ml-2 text-gray-500">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-500/70 rounded-full animate-bounce [animation-delay:-0.2s]" />
        <span className="w-2 h-2 bg-gray-500/70 rounded-full animate-bounce [animation-delay:-0.1s]" />
        <span className="w-2 h-2 bg-gray-500/70 rounded-full animate-bounce" />
      </div>
      <span className="text-sm">AI is typing…</span>
    </div>
  );
}
