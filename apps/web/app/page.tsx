"use client";

import { useMemo, useState } from "react";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { KpiPanel } from "@/components/kpi/KpiPanel";
import { levelConfigs, npcProfiles } from "@/lib/config/npcLevels";
import type { ChatMessage } from "@/lib/types/chat";
import type { LanguageFeedback } from "@/lib/types/evaluation";

function createSessionId() {
  return `session-${crypto.randomUUID()}`;
}

export default function Page() {
  const [sessionId, setSessionId] = useState<string>(createSessionId);
  const [selectedLevelId, setSelectedLevelId] = useState<string>(levelConfigs[0].id);
  const [selectedNpcId, setSelectedNpcId] = useState<string>(npcProfiles[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<LanguageFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scenarioId = useMemo(
    () => `${selectedLevelId}-${selectedNpcId}`,
    [selectedLevelId, selectedNpcId],
  );

  const sessionShort = useMemo(() => sessionId.slice(-8), [sessionId]);

  async function sendMessage() {
    const trimmed = draft.trim();
    if (!trimmed || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);
    setStreamingText("");

    const previousMessages = [...messages];
    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setDraft("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          levelId: selectedLevelId,
          npcId: selectedNpcId,
          scenarioId,
          userMessage: trimmed,
          conversationMessages: previousMessages,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start chat stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          const payload = JSON.parse(line) as {
            token?: string;
            done?: boolean;
            error?: string;
          };

          if (payload.error) {
            throw new Error(payload.error);
          }

          if (payload.token) {
            assistantText += payload.token;
            setStreamingText(assistantText);
          }
        }
      }

      if (assistantText.trim()) {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: assistantText.trim() },
        ]);
      }
      setStreamingText("");
    } catch (streamError) {
      setError(
        streamError instanceof Error
          ? streamError.message
          : "Unable to send message right now.",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function analyzeConversation() {
    if (messages.length === 0 || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          levelId: selectedLevelId,
          npcId: selectedNpcId,
          scenarioId,
          conversationMessages: messages.filter(
            (message) => message.role === "user" || message.role === "assistant",
          ),
        }),
      });

      const result = (await response.json()) as LanguageFeedback | { error: string };
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Analysis failed.");
      }

      setFeedback(result);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to analyze this conversation right now.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function resetConversation() {
    setMessages([]);
    setDraft("");
    setStreamingText("");
    setFeedback(null);
    setError(null);
    setSessionId(createSessionId());
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header-brand">
          <span aria-hidden className="text-2xl">
            🇮🇹
          </span>
          <div>
            <h1 className="page-header-title">Italian NPC practice</h1>
            <p className="page-header-sub">Conversation rehearsal and structured language feedback</p>
          </div>
        </div>
        <span className="session-badge" title={sessionId}>
          Session …{sessionShort}
        </span>
      </header>
      <main className="page-main-inner">
        <section className="split-grid">
          <ChatPanel
            messages={messages}
            streamingText={streamingText}
            draft={draft}
            isSending={isSending}
            selectedLevelId={selectedLevelId}
            selectedNpcId={selectedNpcId}
            levels={levelConfigs}
            npcs={npcProfiles}
            onLevelChange={setSelectedLevelId}
            onNpcChange={setSelectedNpcId}
            onDraftChange={setDraft}
            onSend={sendMessage}
          />
          <KpiPanel
            feedback={feedback}
            isAnalyzing={isAnalyzing}
            canAnalyze={
              messages.length > 0 &&
              !isSending &&
              !isAnalyzing &&
              streamingText.trim().length === 0
            }
            error={error}
            onAnalyze={analyzeConversation}
            onReset={resetConversation}
          />
        </section>
      </main>
    </div>
  );
}
