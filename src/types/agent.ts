export type MessageRole = "user" | "assistant" | "system" | "tool";

export type ToolPermission = "allow" | "ask" | "forbid";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  permission: ToolPermission;
  category: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
  status: "pending" | "running" | "completed" | "failed" | "awaiting_approval";
  startedAt: number;
  completedAt?: number;
}

export interface LLMRequest {
  id: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  timestamp: number;
  durationMs: number;
  status: "pending" | "streaming" | "completed" | "error";
  systemPrompt?: string;
  prompt?: string;
  response?: string;
  preset?: ModelPreset;
}

export type AgentStepKind = "context" | "reasoning" | "action";

/** A per-step variant for an assistant turn. Lets users branch on each
 *  of the three sub-steps (prepared context, queried model, action). */
export interface StepVariant {
  id: string;
  /** Short label shown in the branches panel, e.g. model name or tool name. */
  label: string;
  createdAt: number;
}

export interface StepBranches {
  /** All variants for this step, including the currently-selected one. */
  variants: StepVariant[];
  /** Index into `variants` that is currently active. */
  selectedIndex: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  llmRequest?: LLMRequest;
  parentId?: string | null;
  /** Optional per-step branching metadata for assistant turns. */
  stepBranches?: Partial<Record<AgentStepKind, StepBranches>>;
}

export interface ModelPreset {
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  toolIds: string[];
  systemPrompt: string;
  defaultModel: string;
  defaultPreset: ModelPreset;
  icon?: string;
}

export interface Conversation {
  id: string;
  title: string;
  /** Flat map of all messages across all branches, keyed by id. */
  nodes: Record<string, ChatMessage>;
  /** Currently active leaf — the displayed path is computed by walking parentId up from here. */
  headId: string | null;
  createdAt: number;
  updatedAt: number;
  group?: string;
}
