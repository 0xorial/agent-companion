import { useState, useRef, useEffect } from "react";
import {
  SendHorizonal,
  Paperclip,
  Bot,
  Wrench,
  ChevronDown,
  X,
  Cpu,
  SlidersHorizontal,
} from "lucide-react";
import { AgentDefinition, ToolDefinition, ModelPreset } from "@/types/agent";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  disabled?: boolean;
  agents: AgentDefinition[];
  tools: ToolDefinition[];
  models: string[];
  selectedAgentId: string | null;
  onAgentChange: (agentId: string | null) => void;
  selectedToolIds: string[];
  onToolToggle: (toolId: string) => void;
  modelOverride: string | null;
  onModelOverride: (model: string | null) => void;
  presetOverride: Partial<ModelPreset>;
  onPresetOverride: (preset: Partial<ModelPreset>) => void;
}

export function ChatInput({
  onSend,
  disabled,
  agents,
  tools,
  models,
  selectedAgentId,
  onAgentChange,
  selectedToolIds,
  onToolToggle,
  modelOverride,
  onModelOverride,
  presetOverride,
  onPresetOverride,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;
  const activeModel = modelOverride ?? selectedAgent?.defaultModel ?? models[0];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  const handleSubmit = () => {
    if ((!value.trim() && attachments.length === 0) || disabled) return;
    onSend(value.trim(), attachments.length > 0 ? attachments : undefined);
    setValue("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t bg-card/50 backdrop-blur-sm p-3">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {attachments.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs bg-secondary/60 rounded-md px-2 py-1 text-foreground"
              >
                <Paperclip className="w-3 h-3 text-muted-foreground" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div className="relative flex items-end rounded-lg border bg-secondary/30 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/30 transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none p-3 pr-12 outline-none scrollbar-thin max-h-[200px]"
          />
          <button
            onClick={handleSubmit}
            disabled={(!value.trim() && attachments.length === 0) || disabled}
            className="absolute right-2 bottom-2 p-1.5 rounded-md bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <SendHorizonal className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-0.5 flex-wrap">
          {/* File attach */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5" />
            Attach
          </button>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Agent selector */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground">
                <Bot className="w-3.5 h-3.5" />
                <span className="max-w-[100px] truncate">
                  {selectedAgent?.name ?? "No agent"}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-1"
              align="start"
              side="top"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 font-semibold">
                Select Agent
              </div>
              <button
                onClick={() => onAgentChange(null)}
                className={`w-full text-left px-2 py-1.5 rounded-sm text-xs transition-colors ${
                  !selectedAgentId
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                None (manual)
              </button>
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => onAgentChange(agent.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-sm text-xs transition-colors ${
                    selectedAgentId === agent.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {agent.description}
                  </div>
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Tool selector */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground">
                <Wrench className="w-3.5 h-3.5" />
                <span>{selectedToolIds.length} tools</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-1 max-h-60 overflow-y-auto"
              align="start"
              side="top"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 font-semibold">
                Active Tools
              </div>
              {tools.map((tool) => {
                const active = selectedToolIds.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => onToolToggle(tool.id)}
                    className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-sm text-xs transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                        active
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {active && (
                        <span className="text-primary-foreground text-[8px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="font-mono">{tool.name}</span>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Model selector */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground">
                <Cpu className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate font-mono">
                  {activeModel}
                </span>
                {modelOverride && (
                  <span className="text-[9px] text-warning font-medium">
                    override
                  </span>
                )}
                <ChevronDown className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-1"
              align="start"
              side="top"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 font-semibold">
                Model {selectedAgent && "(agent default: " + selectedAgent.defaultModel.split("-").slice(0, 2).join("-") + ")"}
              </div>
              {selectedAgent && modelOverride && (
                <button
                  onClick={() => onModelOverride(null)}
                  className="w-full text-left px-2 py-1.5 rounded-sm text-xs text-warning hover:bg-secondary transition-colors"
                >
                  Reset to agent default
                </button>
              )}
              {models.map((model) => (
                <button
                  key={model}
                  onClick={() =>
                    onModelOverride(
                      model === selectedAgent?.defaultModel ? null : model
                    )
                  }
                  className={`w-full text-left px-2 py-1.5 rounded-sm text-xs font-mono transition-colors ${
                    model === activeModel
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {model}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Preset overrides */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {Object.keys(presetOverride).length > 0 && (
                  <span className="text-[9px] text-warning font-medium">
                    modified
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-3" align="start" side="top">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Model Presets
                {Object.keys(presetOverride).length > 0 && (
                  <button
                    onClick={() => onPresetOverride({})}
                    className="ml-2 text-warning hover:text-foreground"
                  >
                    reset
                  </button>
                )}
              </div>
              <PresetSlider
                label="Temperature"
                value={
                  presetOverride.temperature ??
                  selectedAgent?.defaultPreset.temperature ??
                  0.7
                }
                min={0}
                max={2}
                step={0.1}
                onChange={(v) =>
                  onPresetOverride({ ...presetOverride, temperature: v })
                }
              />
              <PresetSlider
                label="Max Tokens"
                value={
                  presetOverride.maxTokens ??
                  selectedAgent?.defaultPreset.maxTokens ??
                  4096
                }
                min={256}
                max={32768}
                step={256}
                onChange={(v) =>
                  onPresetOverride({ ...presetOverride, maxTokens: v })
                }
              />
              <PresetSlider
                label="Top P"
                value={
                  presetOverride.topP ??
                  selectedAgent?.defaultPreset.topP ??
                  1
                }
                min={0}
                max={1}
                step={0.05}
                onChange={(v) =>
                  onPresetOverride({ ...presetOverride, topP: v })
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

function PresetSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">
          {max > 100 ? value : value.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}
