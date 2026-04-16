import { useEffect, useRef } from "react";
import { ChatMessage as ChatMessageType, ModelPreset } from "@/types/agent";
import { ChatMessage } from "./ChatMessage";
import { ThinkingItem } from "./ThinkingItem";
import { Bot } from "lucide-react";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  onToolApprove?: (toolCallId: string) => void;
  onToolDeny?: (toolCallId: string) => void;
  onForkAt?: (
    messageId: string,
    edited: {
      systemPrompt: string;
      prompt: string;
      response: string;
      model: string;
      preset: ModelPreset;
    }
  ) => void;
}

export function ChatMessageList({
  messages,
  onToolApprove,
  onToolDeny,
  onForkAt,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);

  const lastUserMsgIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return i;
    }
    return -1;
  })();

  useEffect(() => {
    if (lastUserMsgRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = lastUserMsgRef.current;
      container.scrollTop = el.offsetTop;
    }
  }, [messages, lastUserMsgIndex]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <Bot className="w-10 h-10 mb-3 text-primary/30" />
        <p className="text-sm">Start a conversation</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4">
      {messages.map((msg, i) => (
        <div
          key={msg.id}
          ref={i === lastUserMsgIndex ? lastUserMsgRef : undefined}
        >
          {msg.role === "assistant" && msg.llmRequest && (
            <ThinkingItem
              request={msg.llmRequest}
              onFork={
                onForkAt
                  ? (edited) => onForkAt(msg.id, edited)
                  : undefined
              }
            />
          )}
          <ChatMessage
            message={msg}
            onToolApprove={onToolApprove}
            onToolDeny={onToolDeny}
          />
        </div>
      ))}
      <div className="min-h-[60vh]" />
    </div>
  );
}
