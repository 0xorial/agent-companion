import { useMemo, useState } from "react";
import {
  Database,
  ChevronDown,
  ChevronRight,
  Split,
  Zap,
  Sparkles,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface RagStorage {
  id: string;
  name: string;
  description: string;
  docCount: number;
  /** Small canned corpus used to fake retrieval previews. */
  sampleChunks: string[];
}

export type RagMode = "direct" | "llm-split";

interface RagPreinjectionProps {
  storages: RagStorage[];
  enabledStorageIds: string[];
  onToggleStorage: (id: string) => void;
  mode: RagMode;
  onModeChange: (m: RagMode) => void;
  topK: number;
  onTopKChange: (n: number) => void;
  /** Current draft in the composer, used for direct-mode preview. */
  query: string;
}

// Rough char->token estimate. Good enough for a UI preview.
const estimateTokens = (s: string) => Math.max(0, Math.ceil(s.length / 4));

/** Very naive keyword scorer to fake retrieval in the preview. */
function scoreChunks(chunks: string[], query: string, topK: number) {
  const q = query.toLowerCase();
  const terms = q.split(/\W+/).filter((w) => w.length > 2);
  const scored = chunks.map((c, i) => {
    const lc = c.toLowerCase();
    let score = 0;
    for (const t of terms) if (lc.includes(t)) score += 1;
    // Small deterministic tiebreaker so previews aren't empty when nothing matches.
    return { chunk: c, score: score + (chunks.length - i) * 0.001, idx: i };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((s, i) => s.score > 0 || i < Math.min(topK, 2));
}

export function RagPreinjection({
  storages,
  enabledStorageIds,
  onToggleStorage,
  mode,
  onModeChange,
  topK,
  onTopKChange,
  query,
}: RagPreinjectionProps) {
  const [expanded, setExpanded] = useState(false);
  const enabled = storages.filter((s) => enabledStorageIds.includes(s.id));

  const previews = useMemo(() => {
    if (mode !== "direct") return [];
    return enabled.map((s) => ({
      storage: s,
      hits: scoreChunks(s.sampleChunks, query, topK),
    }));
  }, [enabled, mode, query, topK]);

  const totalTokens = useMemo(
    () =>
      previews.reduce(
        (acc, p) =>
          acc + p.hits.reduce((a, h) => a + estimateTokens(h.chunk), 0),
        0
      ),
    [previews]
  );
  const totalHits = previews.reduce((a, p) => a + p.hits.length, 0);

  const isActive = enabled.length > 0;

  return (
    <div className="rounded-lg border bg-secondary/20">
      {/* Header row */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 flex-wrap">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title={expanded ? "Collapse RAG panel" : "Expand RAG panel"}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          <Database
            className={`w-3.5 h-3.5 ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <span className="font-medium">RAG</span>
        </button>

        {/* Storage chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {storages.map((s) => {
            const on = enabledStorageIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => onToggleStorage(s.id)}
                title={`${s.description} · ${s.docCount} docs`}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] border transition-colors ${
                  on
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {on && <Check className="w-3 h-3" />}
                <span className="font-mono">{s.name}</span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Mode toggle */}
        <div className="flex items-center rounded-md border overflow-hidden text-[11px]">
          <button
            onClick={() => onModeChange("direct")}
            className={`flex items-center gap-1 px-1.5 py-0.5 transition-colors ${
              mode === "direct"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary/60"
            }`}
            title="Direct retrieval on the raw user message"
          >
            <Zap className="w-3 h-3" />
            Direct
          </button>
          <button
            onClick={() => onModeChange("llm-split")}
            className={`flex items-center gap-1 px-1.5 py-0.5 transition-colors border-l ${
              mode === "llm-split"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary/60"
            }`}
            title="Ask a small LLM to split the message into RAG queries first"
          >
            <Split className="w-3 h-3" />
            LLM-split
          </button>
        </div>

        {/* Top-K */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
              <span className="font-mono">k={topK}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-1" align="start" side="top">
            {[1, 2, 3, 5, 8].map((n) => (
              <button
                key={n}
                onClick={() => onTopKChange(n)}
                className={`w-full text-left px-2 py-1 rounded-sm text-xs font-mono transition-colors ${
                  n === topK
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                top-{n}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Estimate on the right */}
        <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
          {mode === "direct" && isActive ? (
            <>
              <span className="font-mono">{totalHits} chunks</span>
              <span className="font-mono text-foreground">
                ~{totalTokens.toLocaleString()} tok
              </span>
            </>
          ) : mode === "llm-split" && isActive ? (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-agent-glow-muted" />
              runtime estimate
            </span>
          ) : (
            <span className="italic">no storages</span>
          )}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-2 py-2 space-y-2">
          {!isActive && (
            <div className="text-[11px] text-muted-foreground italic px-1">
              Enable at least one storage to preinject context.
            </div>
          )}

          {mode === "llm-split" && isActive && (
            <div className="flex items-start gap-2 rounded-md bg-secondary/40 p-2 text-[11px] text-muted-foreground">
              <Split className="w-3.5 h-3.5 text-agent-glow-muted mt-0.5 shrink-0" />
              <span>
                A small model will split your message into sub-queries at runtime,
                then run one retrieval per query against{" "}
                <span className="font-mono text-foreground">
                  {enabled.map((s) => s.name).join(", ")}
                </span>
                . Token cost is only known after splitting.
              </span>
            </div>
          )}

          {mode === "direct" &&
            isActive &&
            (query.trim().length === 0 ? (
              <div className="text-[11px] text-muted-foreground italic px-1">
                Type a message to preview retrieved chunks.
              </div>
            ) : (
              <div className="space-y-2">
                {previews.map(({ storage, hits }) => {
                  const storageTokens = hits.reduce(
                    (a, h) => a + estimateTokens(h.chunk),
                    0
                  );
                  return (
                    <div key={storage.id} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Database className="w-3 h-3" />
                        <span className="font-mono text-foreground">
                          {storage.name}
                        </span>
                        <span className="ml-auto font-mono">
                          {hits.length} · ~{storageTokens} tok
                        </span>
                      </div>
                      {hits.length === 0 ? (
                        <div className="text-[11px] text-muted-foreground italic pl-4">
                          no matches
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {hits.map((h) => (
                            <div
                              key={h.idx}
                              className="text-[11px] leading-snug rounded-sm bg-secondary/50 border border-border/50 px-2 py-1 text-foreground/90"
                            >
                              {h.chunk}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
