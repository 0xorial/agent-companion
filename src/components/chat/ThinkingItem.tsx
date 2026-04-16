import { useState } from "react";
import { LLMRequest, ModelPreset } from "@/types/agent";
import { Brain, ChevronRight, Pencil, GitBranch, X, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ThinkingItemProps {
  request: LLMRequest;
  onFork?: (edited: {
    systemPrompt: string;
    prompt: string;
    response: string;
    model: string;
    preset: ModelPreset;
  }) => void;
}

export function ThinkingItem({ request, onFork }: ThinkingItemProps) {
  const [open, setOpen] = useState(true);
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
    setOpen(false);
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

  return (
    <div className="max-w-3xl mx-auto px-3">
      <div className="border-l-2 border-border/60 pl-3 my-1.5 group/think">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-0.5"
          >
            <ChevronRight
              className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
            />
            <Brain className="w-3 h-3" />
            <span className="font-medium">Thought</span>
            <span className="opacity-60">
              · {request.model} · {request.promptTokens + request.completionTokens} tok · {request.durationMs}ms
            </span>
          </button>
          {open && !editing && onFork && (
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

        {open && (
          <div className="mt-2 space-y-2 text-xs">
            {editing ? (
              <>
                <Field label="Model">
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="h-7 text-xs"
                  />
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
            ) : (
              <>
                <ReadOnlySection label="System prompt" value={request.systemPrompt} />
                <ReadOnlySection label="Prompt" value={request.prompt} />
                <ReadOnlySection label="Response" value={request.response} />
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground pt-1">
                  <span>prompt: {request.promptTokens}t</span>
                  <span>completion: {request.completionTokens}t</span>
                  {request.preset && (
                    <>
                      <span>temp: {request.preset.temperature}</span>
                      <span>max: {request.preset.maxTokens}</span>
                      <span>top_p: {request.preset.topP}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
