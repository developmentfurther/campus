"use client";

import clsx from "clsx";

export default function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div
      className={clsx("flex w-full", {
        "justify-end": isUser,
        "justify-start": !isUser,
      })}
    >
      <div
        className={clsx(
          "px-4 py-3 max-w-[75%] rounded-xl shadow-sm whitespace-pre-wrap leading-relaxed",
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
