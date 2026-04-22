import { AgentDefinition, ChatMessage, Conversation, ToolDefinition } from "@/types/agent";
import { fromLinear } from "@/lib/conversation";

export const mockTools: ToolDefinition[] = [
  { id: "1", name: "file_read", description: "Read contents of a file from the filesystem", permission: "allow", category: "Filesystem" },
  { id: "2", name: "file_write", description: "Write or overwrite a file on the filesystem", permission: "ask", category: "Filesystem" },
  { id: "3", name: "shell_exec", description: "Execute a shell command and return output", permission: "ask", category: "System" },
  { id: "4", name: "web_search", description: "Search the web and return results", permission: "allow", category: "Web" },
  { id: "5", name: "web_fetch", description: "Fetch a URL and return its content", permission: "allow", category: "Web" },
  { id: "6", name: "db_query", description: "Execute a read-only SQL query against the database", permission: "allow", category: "Database" },
  { id: "7", name: "db_mutate", description: "Execute a write SQL query (INSERT, UPDATE, DELETE)", permission: "ask", category: "Database" },
  { id: "8", name: "code_interpret", description: "Run Python code in a sandboxed environment", permission: "allow", category: "Code" },
  { id: "9", name: "send_email", description: "Send an email via configured SMTP", permission: "forbid", category: "Communication" },
];

export const mockModels = [
  "claude-sonnet-4-20250514",
  "claude-opus-4-20250514",
  "gpt-4o",
  "gpt-4o-mini",
  "gemini-2.5-pro",
  "deepseek-r1",
];

export const mockAgents: AgentDefinition[] = [
  {
    id: "a1",
    name: "General Assistant",
    description: "All-purpose coding assistant with full tool access",
    toolIds: ["1", "2", "3", "4", "5", "6", "7", "8"],
    systemPrompt: "You are a helpful coding assistant...",
    defaultModel: "claude-sonnet-4-20250514",
    defaultPreset: { temperature: 0.7, maxTokens: 4096, topP: 1 },
  },
  {
    id: "a2",
    name: "Code Reviewer",
    description: "Read-only reviewer — no write or execute permissions",
    toolIds: ["1", "4", "5", "6"],
    systemPrompt: "You are a thorough code reviewer...",
    defaultModel: "claude-sonnet-4-20250514",
    defaultPreset: { temperature: 0.3, maxTokens: 8192, topP: 0.9 },
  },
  {
    id: "a3",
    name: "DevOps Agent",
    description: "Deployment, CI/CD, and infrastructure management",
    toolIds: ["1", "2", "3", "7"],
    systemPrompt: "You are a DevOps engineer...",
    defaultModel: "gpt-4o",
    defaultPreset: { temperature: 0.5, maxTokens: 4096, topP: 1 },
  },
  {
    id: "a4",
    name: "Research Agent",
    description: "Web research and data analysis specialist",
    toolIds: ["4", "5", "6", "8"],
    systemPrompt: "You are a research specialist...",
    defaultModel: "gemini-2.5-pro",
    defaultPreset: { temperature: 0.8, maxTokens: 16384, topP: 1 },
  },
];

// ---- Conversation 1: "Refactor auth middleware" with two branches at m3 ----
const conv1Linear: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Can you help me refactor the authentication middleware? It's become a mess with too many edge cases.",
    timestamp: Date.now() - 3600000,
  },
  {
    id: "m2",
    role: "assistant",
    content: "I'll analyze the current middleware structure. Let me read the auth files first.",
    timestamp: Date.now() - 3590000,
    llmRequest: {
      id: "llm1",
      model: "claude-sonnet-4-20250514",
      promptTokens: 1240,
      completionTokens: 89,
      timestamp: Date.now() - 3590000,
      durationMs: 1200,
      status: "completed",
      systemPrompt: "You are a helpful coding assistant. Be concise and technical.",
      prompt: "Can you help me refactor the authentication middleware? It's become a mess with too many edge cases.",
      response: "I'll analyze the current middleware structure. Let me read the auth files first.\n\n[tool_call: file_read(path='src/middleware/auth.ts')]",
      preset: { temperature: 0.7, maxTokens: 4096, topP: 1 },
    },
    toolCalls: [
      {
        id: "tc1",
        toolName: "file_read",
        args: { path: "src/middleware/auth.ts" },
        result: "// Auth middleware with 340 lines...",
        status: "completed",
        startedAt: Date.now() - 3589000,
        completedAt: Date.now() - 3588000,
      },
    ],
  },
  {
    id: "m3",
    role: "assistant",
    content: "I've analyzed the middleware. Here's what I found:\n\n1. **Token validation** is duplicated across 3 functions\n2. **Error handling** is inconsistent — some paths throw, others return null\n3. **Rate limiting** logic is mixed into auth checks\n\nI recommend extracting these into separate concerns. Want me to proceed with the refactor?",
    timestamp: Date.now() - 3580000,
    llmRequest: {
      id: "llm2",
      model: "claude-sonnet-4-20250514",
      promptTokens: 2800,
      completionTokens: 340,
      timestamp: Date.now() - 3580000,
      durationMs: 2100,
      status: "completed",
      systemPrompt: "You are a helpful coding assistant. Be concise and technical.",
      prompt: "[previous turn + tool result]\n\n// Auth middleware with 340 lines of code containing token validation, rate limiting and error handling all interleaved...",
      response: "I've analyzed the middleware. Here's what I found:\n\n1. Token validation is duplicated across 3 functions\n2. Error handling is inconsistent — some paths throw, others return null\n3. Rate limiting logic is mixed into auth checks\n\nI recommend extracting these into separate concerns. Want me to proceed with the refactor?",
      preset: { temperature: 0.7, maxTokens: 4096, topP: 1 },
    },
  },
];

const conv1Built = fromLinear(conv1Linear);

// Sibling branch under m2: an alternative m3 ("m3b") created by editing the Thought.
const m3b: ChatMessage = {
  id: "m3b",
  role: "assistant",
  parentId: "m2",
  content: "Edited recommendation: skip the abstraction-heavy refactor. Instead:\n\n1. **Inline-document the 3 token paths** — they're not actually duplicated, they handle JWT, session cookie, and API key differently.\n2. **Add a typed Result<T, AuthError>** so error handling becomes uniform without a rewrite.\n3. **Extract rate limiting into a separate middleware layer** — it's the only true cross-cutting concern.\n\nWant me to start with the Result type?",
  timestamp: Date.now() - 1700000,
  llmRequest: {
    id: "llm2b",
    model: "gpt-4o",
    promptTokens: 2800,
    completionTokens: 280,
    timestamp: Date.now() - 1700000,
    durationMs: 1800,
    status: "completed",
    systemPrompt: "You are a senior engineer. Prefer minimal, surgical changes over large refactors.",
    prompt: "[previous turn + tool result]\n\n// Auth middleware with 340 lines of code...",
    response: "Edited recommendation: skip the abstraction-heavy refactor. Instead:\n\n1. Inline-document the 3 token paths...\n2. Add a typed Result<T, AuthError>...\n3. Extract rate limiting into a separate middleware layer...",
    preset: { temperature: 0.4, maxTokens: 4096, topP: 1 },
  },
};

const conv1Nodes = { ...conv1Built.nodes, [m3b.id]: m3b };

// ---- Conversation 2: "Deploy to production" linear ----
const conv2Linear: ChatMessage[] = [
  {
    id: "m10",
    role: "user",
    content: "Deploy the latest build to production and run the database migration.",
    timestamp: Date.now() - 600000,
  },
  {
    id: "m11",
    role: "assistant",
    content: "I'll start by running the build, then execute the migration and deploy. Let me check the current status first.",
    timestamp: Date.now() - 590000,
    llmRequest: {
      id: "llm10",
      model: "claude-sonnet-4-20250514",
      promptTokens: 980,
      completionTokens: 64,
      timestamp: Date.now() - 590000,
      durationMs: 900,
      status: "completed",
      systemPrompt: "You are a DevOps engineer. Be careful with destructive operations and always ask for approval.",
      prompt: "Deploy the latest build to production and run the database migration.",
      response: "I'll start by running the build, then execute the migration and deploy. Let me check the current status first.\n\n[tool_call: shell_exec(command='npm run build')]",
      preset: { temperature: 0.5, maxTokens: 4096, topP: 1 },
    },
    toolCalls: [
      {
        id: "tc10",
        toolName: "shell_exec",
        args: { command: "npm run build" },
        result: "Build completed successfully in 12.4s\n✓ 847 modules transformed",
        status: "completed",
        startedAt: Date.now() - 589000,
        completedAt: Date.now() - 576000,
      },
    ],
  },
  {
    id: "m12",
    role: "assistant",
    content: "Build succeeded. Now I need to run the database migration. This will alter the `users` table and add a new `sessions` table. I need your approval since this modifies the database.",
    timestamp: Date.now() - 570000,
    llmRequest: {
      id: "llm11",
      model: "claude-sonnet-4-20250514",
      promptTokens: 3200,
      completionTokens: 120,
      timestamp: Date.now() - 570000,
      durationMs: 1400,
      status: "completed",
      systemPrompt: "You are a DevOps engineer. Be careful with destructive operations and always ask for approval.",
      prompt: "[previous turn + build output]\nBuild completed successfully in 12.4s",
      response: "Build succeeded. Now I need to run the database migration...",
      preset: { temperature: 0.5, maxTokens: 4096, topP: 1 },
    },
    toolCalls: [
      {
        id: "tc11",
        toolName: "db_mutate",
        args: {
          query: "ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;\nCREATE TABLE sessions (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id UUID REFERENCES users(id) ON DELETE CASCADE,\n  token TEXT NOT NULL,\n  expires_at TIMESTAMP NOT NULL,\n  created_at TIMESTAMP DEFAULT now()\n);",
        },
        status: "awaiting_approval",
        startedAt: Date.now() - 569000,
      },
    ],
  },
];

const conv2Built = fromLinear(conv2Linear);

export const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Refactor auth middleware",
    group: "Work",
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1700000,
    nodes: conv1Nodes,
    headId: "m3", // default to original branch
  },
  {
    id: "2",
    title: "Deploy to production",
    group: "DevOps",
    createdAt: Date.now() - 600000,
    updatedAt: Date.now() - 60000,
    nodes: conv2Built.nodes,
    headId: conv2Built.headId,
  },
  {
    id: "3",
    title: "Database migration plan",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 80000000,
    group: "DevOps",
    nodes: {},
    headId: null,
  },
  {
    id: "4",
    title: "API rate limiter design",
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 170000000,
    group: "Work",
    nodes: {},
    headId: null,
  },
];
