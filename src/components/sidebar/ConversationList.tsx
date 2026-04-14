import { useState, useMemo } from "react";
import { Conversation } from "@/types/agent";
import { MessageSquare, Plus, ChevronRight, Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ConversationList({ conversations, activeId, onSelect, onNew }: ConversationListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const groups: Record<string, Conversation[]> = {};
    const ungrouped: Conversation[] = [];
    for (const conv of conversations) {
      if (conv.group) {
        (groups[conv.group] ??= []).push(conv);
      } else {
        ungrouped.push(conv);
      }
    }
    return { groups, ungrouped };
  }, [conversations]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const renderConv = (conv: Conversation) => (
    <button
      key={conv.id}
      onClick={() => onSelect(conv.id)}
      className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors group ${
        activeId === conv.id
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate font-medium">{conv.title}</span>
      </div>
      <span className="text-[10px] text-muted-foreground ml-5.5 block mt-0.5">
        {formatDistanceToNow(conv.updatedAt, { addSuffix: true })}
      </span>
    </button>
  );

  const groupNames = Object.keys(grouped.groups).sort();

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {groupNames.map((group) => {
          const isCollapsed = collapsedGroups.has(group);
          const convs = grouped.groups[group];
          return (
            <div key={group}>
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors uppercase tracking-wider"
              >
                <ChevronRight
                  className={`w-3 h-3 shrink-0 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                />
                <Folder className="w-3 h-3 shrink-0" />
                <span className="truncate">{group}</span>
                <span className="ml-auto text-[10px] font-normal tabular-nums">{convs.length}</span>
              </button>
              {!isCollapsed && (
                <div className="ml-2 space-y-0.5 mt-0.5">
                  {convs.map(renderConv)}
                </div>
              )}
            </div>
          );
        })}

        {grouped.ungrouped.length > 0 && (
          <>
            {groupNames.length > 0 && (
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ungrouped
              </div>
            )}
            <div className="space-y-0.5">
              {grouped.ungrouped.map(renderConv)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
