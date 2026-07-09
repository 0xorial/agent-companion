import { useMemo, useState } from "react";
import { ConversationList } from "@/components/sidebar/ConversationList";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ActivityPanel } from "@/components/panels/ActivityPanel";
import { BranchTree } from "@/components/panels/BranchTree";
import { StepDetailsPanel } from "@/components/panels/StepDetailsPanel";
import { ToolRegistry } from "@/components/tools/ToolRegistry";
import { mockConversations, mockTools, mockAgents, mockModels } from "@/data/mockData";
import {
  Conversation,
  ToolDefinition,
  ToolPermission,
  ChatMessage as ChatMessageType,
  ModelPreset,
} from "@/types/agent";
import { getActivePath, appendMessage } from "@/lib/conversation";
import {
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Wrench,
  Activity,
  GitBranch,
  Loader2,
  Play,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(mockConversations[0]?.id ?? null);
  const [tools, setTools] = useState<ToolDefinition[]>(mockTools);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [rightTab, setRightTab] = useState<"activity" | "branches" | "tools" | "step">("branches");
  const [focusedStepMessageId, setFocusedStepMessageId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(mockAgents[0]?.id ?? null);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(mockTools.map((t) => t.id));
  const [modelOverride, setModelOverride] = useState<string | null>(null);
  const [presetOverride, setPresetOverride] = useState<Partial<ModelPreset>>({});
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState<string[]>([]);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;
  const activePath = useMemo(
    () => (activeConv ? getActivePath(activeConv) : []),
    [activeConv]
  );
  const activePathIds = useMemo(
    () => new Set(activePath.map((m) => m.id)),
    [activePath]
  );

  const updateConv = (id: string, fn: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  };

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: "New conversation",
      nodes: {},
      headId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  };

  const handleDeleteConversations = (ids: string[]) => {
    const idSet = new Set(ids);
    setConversations((prev) => prev.filter((c) => !idSet.has(c.id)));
    if (activeConvId && idSet.has(activeConvId)) {
      setActiveConvId(conversations.find((c) => !idSet.has(c.id))?.id ?? null);
    }
  };

  const handleMoveConversations = (ids: string[], group: string | undefined) => {
    const idSet = new Set(ids);
    setConversations((prev) =>
      prev.map((c) => (idSet.has(c.id) ? { ...c, group } : c))
    );
  };

  const handleSend = (content: string) => {
    if (!activeConvId) return;
    const msg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    };
    updateConv(activeConvId, (c) => appendMessage(c, msg));
  };

  const handleEnqueue = (content: string) => {
    setQueuedMessages((prev) => [...prev, content]);
  };

  const handleSteer = (content: string) => {
    if (!activeConvId) return;
    const msg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: `[steer] ${content}`,
      timestamp: Date.now(),
    };
    updateConv(activeConvId, (c) => appendMessage(c, msg));
  };

  const handlePermissionChange = (toolId: string, permission: ToolPermission) => {
    setTools((prev) => prev.map((t) => (t.id === toolId ? { ...t, permission } : t)));
  };

  const handleToolDecision = (toolCallId: string, approved: boolean) => {
    setConversations((prev) =>
      prev.map((c) => {
        const newNodes: Record<string, ChatMessageType> = {};
        let changed = false;
        for (const [id, node] of Object.entries(c.nodes)) {
          if (!node.toolCalls?.some((tc) => tc.id === toolCallId)) {
            newNodes[id] = node;
            continue;
          }
          changed = true;
          newNodes[id] = {
            ...node,
            toolCalls: node.toolCalls.map((tc) =>
              tc.id === toolCallId
                ? {
                    ...tc,
                    status: approved ? ("completed" as const) : ("failed" as const),
                    result: approved
                      ? "Approved by user — executed successfully."
                      : "Denied by user.",
                    completedAt: Date.now(),
                  }
                : tc
            ),
          };
        }
        return changed ? { ...c, nodes: newNodes } : c;
      })
    );
  };

  /** Edit a Thought → create a sibling branch under the same parent and switch head to it. */
  const handleForkAt = (
    messageId: string,
    edited: {
      systemPrompt: string;
      prompt: string;
      response: string;
      model: string;
      preset: ModelPreset;
    }
  ) => {
    if (!activeConv) return;
    const original = activeConv.nodes[messageId];
    if (!original) return;

    const newId = crypto.randomUUID();
    const branchedNode: ChatMessageType = {
      ...original,
      id: newId,
      parentId: original.parentId ?? null,
      content: edited.response,
      timestamp: Date.now(),
      llmRequest: original.llmRequest && {
        ...original.llmRequest,
        id: crypto.randomUUID(),
        systemPrompt: edited.systemPrompt,
        prompt: edited.prompt,
        response: edited.response,
        model: edited.model,
        preset: edited.preset,
        timestamp: Date.now(),
      },
      toolCalls: undefined,
    };

    updateConv(activeConv.id, (c) => ({
      ...c,
      nodes: { ...c.nodes, [newId]: branchedNode },
      headId: newId,
      updatedAt: Date.now(),
    }));
  };

  const handleSwitchToLeaf = (leafId: string) => {
    if (!activeConv) return;
    updateConv(activeConv.id, (c) => ({ ...c, headId: leafId }));
  };

  const handleAgentChange = (agentId: string | null) => {
    setSelectedAgentId(agentId);
    setModelOverride(null);
    setPresetOverride({});
    if (agentId) {
      const agent = mockAgents.find((a) => a.id === agentId);
      if (agent) setSelectedToolIds(agent.toolIds);
    }
  };

  const handleToolToggle = (toolId: string) => {
    setSelectedToolIds((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <div
        className={`border-r bg-sidebar flex flex-col transition-all duration-200 ${
          leftOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-3 border-b flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-foreground tracking-tight">
            AgentOS
          </span>
        </div>
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={setActiveConvId}
          onNew={handleNewChat}
          onDelete={handleDeleteConversations}
          onMove={handleMoveConversations}
        />
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-11 border-b flex items-center px-3 gap-2 bg-card/50 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setLeftOpen(!leftOpen)}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
          >
            {leftOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          <span className="text-sm font-medium text-foreground truncate">
            {activeConv?.title ?? "No conversation"}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setIsAgentWorking((v) => !v)}
              title={isAgentWorking ? "Stop simulated agent run" : "Simulate agent working"}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
                isAgentWorking
                  ? "bg-warning/15 text-warning hover:bg-warning/25"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {isAgentWorking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Working
                  {queuedMessages.length > 0 && (
                    <span className="text-[10px] opacity-80">· {queuedMessages.length} queued</span>
                  )}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Idle
                </>
              )}
            </button>
            <ThemeToggle />
            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
            >
              {rightOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Messages */}
        <ChatMessageList
          conversation={activeConv}
          messages={activePath}
          onToolApprove={(id) => handleToolDecision(id, true)}
          onToolDeny={(id) => handleToolDecision(id, false)}
          onForkAt={handleForkAt}
          onSwitchToLeaf={handleSwitchToLeaf}
        />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onEnqueue={handleEnqueue}
          onSteer={handleSteer}
          isAgentWorking={isAgentWorking}
          agents={mockAgents}
          tools={tools}
          models={mockModels}
          selectedAgentId={selectedAgentId}
          onAgentChange={handleAgentChange}
          selectedToolIds={selectedToolIds}
          onToolToggle={handleToolToggle}
          modelOverride={modelOverride}
          onModelOverride={setModelOverride}
          presetOverride={presetOverride}
          onPresetOverride={setPresetOverride}
        />
      </div>

      {/* Right Panel */}
      <div
        className={`border-l bg-sidebar flex flex-col transition-all duration-200 ${
          rightOpen ? "w-72" : "w-0"
        } overflow-hidden`}
      >
        {/* Tabs */}
        <div className="flex border-b shrink-0">
          <TabButton
            active={rightTab === "branches"}
            onClick={() => setRightTab("branches")}
            icon={<GitBranch className="w-3.5 h-3.5" />}
            label="Branches"
          />
          <TabButton
            active={rightTab === "activity"}
            onClick={() => setRightTab("activity")}
            icon={<Activity className="w-3.5 h-3.5" />}
            label="Activity"
          />
          <TabButton
            active={rightTab === "tools"}
            onClick={() => setRightTab("tools")}
            icon={<Wrench className="w-3.5 h-3.5" />}
            label="Tools"
          />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {rightTab === "branches" ? (
            <BranchTree
              conversation={activeConv}
              activePathIds={activePathIds}
              headId={activeConv?.headId ?? null}
              onSelectLeaf={handleSwitchToLeaf}
            />
          ) : rightTab === "activity" ? (
            <ActivityPanel messages={activePath} />
          ) : (
            <ToolRegistry tools={tools} onPermissionChange={handlePermissionChange} />
          )}
        </div>
      </div>
    </div>
  );
};

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors ${
        active
          ? "text-primary border-b-2 border-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default Index;
