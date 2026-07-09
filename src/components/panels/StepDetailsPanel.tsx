import { ChatMessage } from "@/types/agent";
import { FileText, Sparkles, Wrench, MessageSquare, X } from "lucide-react";

interface StepDetailsPanelProps {
  message: ChatMessage | null;
  onClose: () => void;
}

export function StepDetailsPanel({ message, onClose }: StepDetailsPanelProps) {
  if (!message || !message.llmRequest) {
    return (
      <div className="p-3 text-xs text-muted-foreground">
        Click a collapsed step in the chat to inspect its details here.
      </div>
    );
  }
  const req = message.llmRequest;
  const hasTools = (message.toolCalls?.length ?? 0) > 0;
  const actionLabel = hasTools
    ? `Called ${
        message.toolCalls!.length === 1
          ? message.toolCalls![0].toolName
          : `${message.toolCalls!.length} tools`
      }`
    : "Replied to user";

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step Details
        </h3>
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
          title="Close"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <Section icon={<FileText className="w-3 h-3" />} label="Context">
        <div className="text-[10px] text-muted-foreground">
          {req.promptTokens} input tokens
        </div>
        <ReadOnly label="System prompt" value={req.systemPrompt} />
        <ReadOnly label="Prompt" value={req.prompt} />
      </Section>

      <Section icon={<Sparkles className="w-3 h-3" />} label="Reasoning">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
          <span>{req.model}</span>
          <span>{req.completionTokens} out tok</span>
          <span>{req.durationMs}ms</span>
          {req.preset && (
            <>
              <span>temp: {req.preset.temperature}</span>
              <span>max: {req.preset.maxTokens}</span>
              <span>top_p: {req.preset.topP}</span>
            </>
          )}
        </div>
        <ReadOnly label="Raw response" value={req.response} />
      </Section>

      <Section
        icon={hasTools ? <Wrench className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
        label={hasTools ? "Tool" : "Reply"}
      >
        <div className="text-xs text-foreground/90">{actionLabel}</div>
        {hasTools && message.toolCalls?.map((tc) => (
          <div key={tc.id} className="rounded border border-border/50 bg-muted/30 p-2 space-y-1">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-medium text-foreground">{tc.toolName}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{tc.status}</span>
            </div>
            {tc.arguments && (
              <pre className="text-[10px] font-mono whitespace-pre-wrap break-words text-muted-foreground">
                {typeof tc.arguments === "string" ? tc.arguments : JSON.stringify(tc.arguments, null, 2)}
              </pre>
            )}
            {tc.result && (
              <pre className="text-[10px] font-mono whitespace-pre-wrap break-words text-foreground/80 border-t border-border/40 pt-1">
                {typeof tc.result === "string" ? tc.result : JSON.stringify(tc.result, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 rounded-md border border-border/50 bg-card/40 p-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      <pre className="bg-muted/40 rounded px-2 py-1.5 text-[11px] font-mono text-foreground/90 whitespace-pre-wrap break-words border border-border/50 max-h-64 overflow-y-auto scrollbar-thin">
        {value}
      </pre>
    </div>
  );
}
