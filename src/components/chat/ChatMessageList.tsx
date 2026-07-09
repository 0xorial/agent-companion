import { useEffect, useRef } from "react";
import { ChatMessage as ChatMessageType, Conversation, ModelPreset } from "@/types/agent";
import { ChatMessage } from "./ChatMessage";
import { AgentSteps } from "./AgentSteps";
import { BranchSwitcher } from "./BranchSwitcher";
import { getChildren, getRoots, deepestDescendant } from "@/lib/conversation";
import { Bot } from "lucide-react";

interface ChatMessageListProps {
  conversation: Conversation | null;
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
  onSwitchToLeaf?: (leafId: string) => void;
  isAgentWorking?: boolean;
  onOpenStepDetails?: (messageId: string) => void;
}

export function ChatMessageList({
  conversation,
  messages,
  onToolApprove,
  onToolDeny,
  onForkAt,
  onSwitchToLeaf,
  isAgentWorking,
  onOpenStepDetails,
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
      {messages.map((msg, i) => {
        // Determine sibling set under the same parent
        const siblings = conversation
          ? msg.parentId
            ? getChildren(conversation, msg.parentId)
            : getRoots(conversation)
          : [msg];
        const siblingIndex = siblings.findIndex((s) => s.id === msg.id);

        return (
          <div
            key={msg.id}
            ref={i === lastUserMsgIndex ? lastUserMsgRef : undefined}
          >
            {msg.role === "assistant" && msg.llmRequest && (
              <AgentSteps
                message={msg}
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
              branchSwitcher={
                conversation && siblings.length > 1 && onSwitchToLeaf && !(msg.role === "assistant" && msg.llmRequest) ? (
                  <BranchSwitcher
                    index={siblingIndex}
                    total={siblings.length}
                    onChange={(newIdx) => {
                      const target = siblings[newIdx];
                      onSwitchToLeaf(deepestDescendant(conversation, target.id));
                    }}
                  />
                ) : null
              }
            />
          </div>
        );
      })}
      <div className="min-h-[60vh]" />
    </div>
  );
}
