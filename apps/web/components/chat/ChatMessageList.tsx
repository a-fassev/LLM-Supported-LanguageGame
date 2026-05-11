"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types/chat";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  streamingText: string;
  npcName: string;
  /** True while awaiting first streamed token */
  isStreamingEmpty: boolean;
}

export function ChatMessageList({
  messages,
  streamingText,
  npcName,
  isStreamingEmpty,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const npcInitials = initials(npcName);

  const hasMessages =
    messages.length > 0 || streamingText.length > 0 || isStreamingEmpty;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, streamingText, isStreamingEmpty]);

  if (!hasMessages) {
    return (
      <div
        ref={scrollRef}
        className={cn("chat-scroll-area flex-1", "chat-scroll-area--empty")}
      >
        <div className="empty-state mx-auto max-w-sm border-none">
          <div className="empty-state-icon">
            <MessageCircle className="h-7 w-7" aria-hidden />
          </div>
          <p className="font-medium">Start a role-play with the NPC in Italian</p>
          <p className="text-muted text-sm">
            Pick a level and character above, then type below. Start with short sentences or simple
            questions about yourself and the scenario.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="chat-scroll-area flex-1">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={cn(
            "chat-row max-w-full",
            message.role === "user" ? "chat-row-user" : "chat-row-assistant",
          )}
        >
          <div
            className={cn(
              "chat-avatar",
              message.role === "user" ? "chat-avatar-user" : "chat-avatar-npc",
            )}
            aria-hidden
          >
            {message.role === "user" ? "You" : npcInitials}
          </div>
          <div className="chat-bubble-wrap">
            <div
              className={cn(
                "chat-bubble",
                message.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant",
              )}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          </div>
        </div>
      ))}
      {isStreamingEmpty ? (
        <div className="chat-row chat-row-assistant max-w-full">
          <div className="chat-avatar chat-avatar-npc" aria-hidden>
            {npcInitials}
          </div>
          <div className="chat-bubble-wrap">
            <div className="chat-bubble chat-bubble-assistant">
              <div className="typing-indicator" role="status" aria-label="NPC is typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {streamingText ? (
        <div className="chat-row chat-row-assistant max-w-full">
          <div className="chat-avatar chat-avatar-npc" aria-hidden>
            {npcInitials}
          </div>
          <div className="chat-bubble-wrap">
            <div className="chat-bubble chat-bubble-assistant">
              <p className="whitespace-pre-wrap break-words">{streamingText}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
