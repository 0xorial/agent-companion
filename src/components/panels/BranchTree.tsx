import { Conversation, AgentStepKind } from "@/types/agent";
import { getRoots, getChildren, deepestDescendant } from "@/lib/conversation";
import { GitBranch, User, Bot, Dot, FileText, Sparkles, Zap } from "lucide-react";

interface BranchTreeProps {
  conversation: Conversation | null;
  activePathIds: Set<string>;
  headId: string | null;
  onSelectLeaf: (leafId: string) => void;
}

/** Recursive tree-view of all messages; clicking any node sets head to its deepest descendant. */
export function BranchTree({ conversation, activePathIds, headId, onSelectLeaf }: BranchTreeProps) {
  if (!conversation) {
    return (
      <div className="p-3 text-xs text-muted-foreground">No conversation selected.</div>
    );
  }
  const roots = getRoots(conversation);
  if (roots.length === 0) {
    return (
      <div className="p-3 text-xs text-muted-foreground">No messages yet.</div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 px-1">
        <GitBranch className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Branches
        </h3>
      </div>
      <div className="text-[11px]">
        {roots.map((r) => (
          <Node
            key={r.id}
            conv={conversation}
            id={r.id}
            depth={0}
            activePathIds={activePathIds}
            headId={headId}
            onSelectLeaf={onSelectLeaf}
          />
        ))}
      </div>
    </div>
  );
}

interface NodeProps {
  conv: Conversation;
  id: string;
  depth: number;
  activePathIds: Set<string>;
  headId: string | null;
  onSelectLeaf: (leafId: string) => void;
}

function Node({ conv, id, depth, activePathIds, headId, onSelectLeaf }: NodeProps) {
  const node = conv.nodes[id];
  if (!node) return null;
  const children = getChildren(conv, id);
  const isActive = activePathIds.has(id);
  const isHead = headId === id;
  const hasSiblings = node.parentId
    ? getChildren(conv, node.parentId).length > 1
    : getRoots(conv).length > 1;

  const preview = node.content.slice(0, 60).replace(/\n/g, " ") || "(empty)";

  return (
    <div>
      <button
        onClick={() => onSelectLeaf(deepestDescendant(conv, id))}
        className={`w-full flex items-start gap-1.5 py-1 px-1.5 rounded text-left transition-colors ${
          isActive
            ? "bg-primary/10 text-foreground"
            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        {hasSiblings ? (
          <GitBranch
            className={`w-3 h-3 mt-0.5 shrink-0 ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
        ) : node.role === "user" ? (
          <User className="w-3 h-3 mt-0.5 shrink-0" />
        ) : node.role === "assistant" ? (
          <Bot className="w-3 h-3 mt-0.5 shrink-0" />
        ) : (
          <Dot className="w-3 h-3 mt-0.5 shrink-0" />
        )}
        <span className="truncate flex-1">{preview}</span>
        {isHead && (
          <span className="text-[9px] uppercase tracking-wider text-primary font-semibold">
            head
          </span>
        )}
      </button>
      {node.stepBranches && (
        <div style={{ paddingLeft: `${depth * 12 + 22}px` }} className="space-y-0.5 py-0.5">
          {(["context", "reasoning", "action"] as AgentStepKind[]).map((kind) => {
            const sb = node.stepBranches?.[kind];
            if (!sb || sb.variants.length <= 1) return null;
            const Icon =
              kind === "context" ? FileText : kind === "reasoning" ? Sparkles : Zap;
            const stepLabel =
              kind === "context"
                ? "Context"
                : kind === "reasoning"
                  ? "Reasoning"
                  : "Action";
            return (
              <div key={kind} className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 px-1.5 py-0.5">
                  <Icon className="w-2.5 h-2.5" />
                  <span className="uppercase tracking-wider font-semibold">{stepLabel}</span>
                  <span className="opacity-60 font-mono">
                    {sb.selectedIndex + 1}/{sb.variants.length}
                  </span>
                </div>
                {sb.variants.map((v, idx) => (
                  <div
                    key={v.id}
                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                      idx === sb.selectedIndex
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground"
                    }`}
                    style={{ paddingLeft: "16px" }}
                  >
                    <GitBranch className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{v.label}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {children.map((c) => (
        <Node
          key={c.id}
          conv={conv}
          id={c.id}
          depth={depth + 1}
          activePathIds={activePathIds}
          headId={headId}
          onSelectLeaf={onSelectLeaf}
        />
      ))}
    </div>
  );
}
