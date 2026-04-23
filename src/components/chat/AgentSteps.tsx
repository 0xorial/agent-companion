import { ReactNode, useState } from "react";
import { ChatMessage, LLMRequest, ModelPreset, StepBranches, AgentStepKind } from "@/types/agent";
import {
  ChevronDown,
  FileText,
  Sparkles,
  Pencil,
  GitBranch,
  X,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StepBranchIndicator } from "./StepBranchIndicator";

interface AgentStepsProps {
  message: ChatMessage;
  onFork?: (edited: {
    systemPrompt: string;
    prompt: string;
    response: string;
    model: string;
    preset: ModelPreset;
  }) => void;
  trailing?: ReactNode;
}

/**
 * Renders an agent turn as a compact single-row pipeline of three steps:
 *   1. Context  — what was sent to the LLM
 *   2. Reasoning — the LLM call itself
 *   3. Action    — what the agent did with the response
 *
 * Clicking a step expands it inline; only one step is expanded at a time.
 */
export function AgentSteps({ message, onFork, trailing }: AgentStepsProps) {
  const req = message.llmRequest;
  const [expanded, setExpanded] = useState<AgentStepKind | null>(null);
  // Local per-step variant selection overrides (UI-only for now).
  const [selOverrides, setSelOverrides] = useState<Partial<Record<AgentStepKind, number>>>({});

  if (!req) return null;

  const hasTools = (message.toolCalls?.length ?? 0) > 0;
  const actionLabel = hasTools
    ? `Called ${
        message.toolCalls!.length === 1
          ? message.toolCalls![0].toolName
          : `${message.toolCalls!.length} tools`
      }`
    : "Replied to user";

  const sb = message.stepBranches;

  const toggle = (kind: AgentStepKind) =>
    setExpanded((cur) => (cur === kind ? null : kind));

  const branchesFor = (kind: AgentStepKind): StepBranches | undefined => {
    const base = sb?.[kind];
    if (!base) return undefined;
    const override = selOverrides[kind];
    return override !== undefined ? { ...base, selectedIndex: override } : base;
  };

  const onChangeFor = (kind: AgentStepKind) => (newIdx: number) =>
    setSelOverrides((s) => ({ ...s, [kind]: newIdx }));

  return (
    <div className="max-w-3xl mx-auto px-3">
      <div className="border-l-2 border-border/60 pl-3 my-1.5">
        <div className="flex items-center gap-1 flex-wrap text-[11px] text-muted-foreground py-0.5">
          <StepChip
            icon={<FileText className="w-3 h-3" />}
            label="Context"
            active={expanded === "context"}
            onClick={() => toggle("context")}
            branches={branchesFor("context")}
          />
          <Connector />
          <StepChip
            icon={<Sparkles className="w-3 h-3" />}
            label="Reason"
            active={expanded === "reasoning"}
            onClick={() => toggle("reasoning")}
            branches={branchesFor("reasoning")}
          />
          <Connector />
          <StepChip
            icon={hasTools ? <Wrench className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
            label={hasTools ? "Tool" : "Reply"}
            active={expanded === "action"}
            onClick={() => toggle("action")}
            branches={branchesFor("action")}
          />
        </div>

        {expanded === "context" && (
          <ExpandedShell>
            <BranchSwitcherPanel
              branches={branchesFor("context")}
              onChange={onChangeFor("context")}
            />
            <div className="text-[10px] text-muted-foreground">
              {req.promptTokens} input tokens
            </div>
            <ReadOnlySection label="System prompt" value={req.systemPrompt} />
            <ReadOnlySection label="Prompt" value={req.prompt} />
          </ExpandedShell>
        )}

        {expanded === "reasoning" && (
          <ExpandedShell>
            <BranchSwitcherPanel
              branches={branchesFor("reasoning")}
              onChange={onChangeFor("reasoning")}
            />
            <ReasoningBody request={req} message={message} onFork={onFork} onClose={() => setExpanded(null)} />
          </ExpandedShell>
        )}

        {expanded === "action" && (
          <ExpandedShell>
            <BranchSwitcherPanel
              branches={branchesFor("action")}
              onChange={onChangeFor("action")}
            />
            <div className="text-xs text-foreground/90">{actionLabel}</div>
            {hasTools && (
              <div className="text-[10px] text-muted-foreground">
                See the tool call below for arguments and result.
              </div>
            )}
          </ExpandedShell>
        )}
      </div>
      {trailing}
    </div>
  );
}

/* ---------------- Compact chip (display-only) ---------------- */

function StepChip({
  icon,
  label,
  active,
  onClick,
  branches,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  branches?: StepBranches;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 py-0.5 px-1.5 rounded transition-colors ${
        active
          ? "bg-secondary text-foreground"
          : "hover:bg-secondary/60 hover:text-foreground"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {/* Display-only: no onChange, switching happens in the expanded panel. */}
      <StepBranchIndicator branches={branches} />
      <ChevronDown
        className={`w-3 h-3 transition-transform opacity-60 ${active ? "rotate-180" : ""}`}
      />
    </button>
  );
}

function Connector() {
  return <span className="opacity-30">→</span>;
}

function ExpandedShell({ children }: { children: ReactNode }) {
  return <div className="mt-1.5 ml-1 space-y-2 text-xs">{children}</div>;
}

/* ---------------- Branch switcher (inside expanded panel) ---------------- */

function BranchSwitcherPanel({
  branches,
  onChange,
}: {
  branches?: StepBranches;
  onChange: (newIdx: number) => void;
}) {
  if (!branches || branches.variants.length <= 1) return null;
  const { variants, selectedIndex } = branches;
  return (
    <div className="rounded border border-border/60 bg-muted/30 p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Variants ({variants.length})
        </div>
        <div className="text-[10px] text-muted-foreground">
          Showing {selectedIndex + 1} of {variants.length}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {variants.map((v, idx) => {
          const isActive = idx === selectedIndex;
          return (
            <button
              key={v.id}
              onClick={() => onChange(idx)}
              className={`text-[11px] px-1.5 py-0.5 rounded border transition-colors ${
                isActive
                  ? "bg-primary/15 border-primary/40 text-foreground"
                  : "bg-background border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              title={v.label}
            >
              <span className="font-mono tabular-nums opacity-60 mr-1">#{idx + 1}</span>
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Reasoning body (with edit/fork) ---------------- */

function ReasoningBody({
  request,
  message: _message,
  onFork,
  onClose,
}: {
  request: LLMRequest;
  message: ChatMessage;
  onFork?: AgentStepsProps["onFork"];
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const [systemPrompt, setSystemPrompt] = useState(request.systemPrompt ?? "");
  const [prompt, setPrompt] = useState(request.prompt ?? "");
  const [response, setResponse] = useState(request.response ?? "");
  const [model, setModel] = useState(request.model);
  const [temperature, setTemperature] = useState(request.preset?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(request.preset?.maxTokens ?? 4096);
  const [topP, setTopP] = useState(request.preset?.topP ?? 1);

  const handleSaveFork = () => {
    onFork?.({
      systemPrompt,
      prompt,
      response,
      model,
      preset: { temperature, maxTokens, topP },
    });
    setEditing(false);
    onClose();
  };

  const handleCancel = () => {
    setSystemPrompt(request.systemPrompt ?? "");
    setPrompt(request.prompt ?? "");
    setResponse(request.response ?? "");
    setModel(request.model);
    setTemperature(request.preset?.temperature ?? 0.7);
    setMaxTokens(request.preset?.maxTokens ?? 4096);
    setTopP(request.preset?.topP ?? 1);
    setEditing(false);
  };

  if (editing) {
    return (
      <>
        <Field label="Model">
          <Input value={model} onChange={(e) => setModel(e.target.value)} className="h-7 text-xs" />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Temp">
            <Input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="h-7 text-xs"
            />
          </Field>
          <Field label="Max tokens">
            <Input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="h-7 text-xs"
            />
          </Field>
          <Field label="Top P">
            <Input
              type="number"
              step="0.05"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="h-7 text-xs"
            />
          </Field>
        </div>
        <Field label="System prompt">
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="text-xs min-h-[60px] font-mono"
          />
        </Field>
        <Field label="Prompt">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="text-xs min-h-[80px] font-mono"
          />
        </Field>
        <Field label="Response">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="text-xs min-h-[100px] font-mono"
          />
        </Field>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSaveFork}
            className="flex items-center gap-1.5 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors py-1 px-2.5 rounded"
          >
            <GitBranch className="w-3 h-3" />
            Save & fork conversation
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded hover:bg-secondary"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
        <span>{request.model}</span>
        <span>{request.completionTokens} out tok</span>
        <span>{request.durationMs}ms</span>
        {request.preset && (
          <>
            <span>temp: {request.preset.temperature}</span>
            <span>max: {request.preset.maxTokens}</span>
            <span>top_p: {request.preset.topP}</span>
          </>
        )}
        {onFork && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-0.5 px-1.5 rounded hover:bg-secondary"
            title="Edit & fork conversation"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>
      <ReadOnlySection label="Raw response" value={request.response} />
    </>
  );
}

/* ---------------- Shared ---------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      {children}
    </div>
  );
}

function ReadOnlySection({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      <pre className="bg-muted/40 rounded px-2 py-1.5 text-[11px] font-mono text-foreground/90 whitespace-pre-wrap break-words border border-border/50">
        {value}
      </pre>
    </div>
  );
}
