"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Definimos la estructura del mensaje (igual que en tu ChatBox)
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  corrections?: any[];
  pronunciation?: any;
  isAudio?: boolean;
}

interface ChatContextType {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  clearChat: () => void;
  // Puedes agregar más estados persistentes si quieres (input, etc.)
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const clearChat = () => setMessages([]);

  return (
    <ChatContext.Provider value={{ messages, setMessages, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}