import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import type { ChatMessage, LevelConfig, NpcProfile } from "@/lib/types/chat";

interface ChatPanelProps {
  messages: ChatMessage[];
  streamingText: string;
  draft: string;
  isSending: boolean;
  selectedLevelId: string;
  selectedNpcId: string;
  levels: LevelConfig[];
  npcs: NpcProfile[];
  onLevelChange: (value: string) => void;
  onNpcChange: (value: string) => void;
  onDraftChange: (value: string) => void;
  onSend: () => void;
}

export function ChatPanel({
  messages,
  streamingText,
  draft,
  isSending,
  selectedLevelId,
  selectedNpcId,
  levels,
  npcs,
  onLevelChange,
  onNpcChange,
  onDraftChange,
  onSend,
}: ChatPanelProps) {
  const level = levels.find((l) => l.id === selectedLevelId) ?? levels[0];
  const npc = npcs.find((n) => n.id === selectedNpcId) ?? npcs[0];

  return (
    <Card className="panel flex h-full min-h-0 flex-col rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]">
      <CardHeader className="shrink-0 space-y-0 border-b border-[var(--color-border)] pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">NPC conversation</CardTitle>
            <CardDescription>
              Practice Italian with a configurable game character.
            </CardDescription>
            <div className="chat-header-meta">
              <Badge variant="secondary" className="font-medium">
                {npc.name}
              </Badge>
              <Badge variant="outline" className="font-medium">
                {level.cefrBand}
              </Badge>
              <span className="text-xs text-[var(--color-muted-foreground)]">{level.label}</span>
            </div>
          </div>
        </div>
        <div className="selector-row pt-2">
          <div className="selector-field">
            <label className="selector-label" htmlFor="level-select">
              Level
            </label>
            <Select value={selectedLevelId} onValueChange={onLevelChange}>
              <SelectTrigger id="level-select" className="w-full">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="selector-field">
            <label className="selector-label" htmlFor="npc-select">
              NPC
            </label>
            <Select value={selectedNpcId} onValueChange={onNpcChange}>
              <SelectTrigger id="npc-select" className="w-full">
                <SelectValue placeholder="Select NPC" />
              </SelectTrigger>
              <SelectContent>
                {npcs.map((character) => (
                  <SelectItem key={character.id} value={character.id}>
                    {character.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="panel-content flex flex-1 flex-col gap-4 pt-4">
        <div className="chat-pane">
          <ChatMessageList
            messages={messages}
            streamingText={streamingText}
            npcName={npc.name}
            isStreamingEmpty={isSending && !streamingText}
          />
        </div>
        <div className="chat-input-slot">
          <ChatInput
            value={draft}
            onChange={onDraftChange}
            onSend={onSend}
            disabled={isSending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
