import { useState, useMemo } from "react";
import { Conversation } from "@/types/agent";
import { MessageSquare, Plus, ChevronRight, Folder, Trash2, FolderInput, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete?: (ids: string[]) => void;
  onMove?: (ids: string[], group: string | undefined) => void;
}

export function ConversationList({ conversations, activeId, onSelect, onNew, onDelete, onMove }: ConversationListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

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

  const allGroups = useMemo(() => {
    const set = new Set<string>();
    conversations.forEach((c) => c.group && set.add(c.group));
    return Array.from(set).sort();
  }, [conversations]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    onDelete?.(Array.from(selectedIds));
    exitSelectMode();
  };

  const handleMove = (group: string | undefined) => {
    if (selectedIds.size === 0) return;
    onMove?.(Array.from(selectedIds), group);
    exitSelectMode();
  };

  const renderConv = (conv: Conversation) => (
    <div key={conv.id} className="flex items-center gap-1">
      {selectMode && (
        <Checkbox
          checked={selectedIds.has(conv.id)}
          onCheckedChange={() => toggleSelect(conv.id)}
          className="shrink-0 ml-1"
        />
      )}
      <button
        onClick={() => selectMode ? toggleSelect(conv.id) : onSelect(conv.id)}
        className={`flex-1 text-left px-3 py-2.5 rounded-md text-sm transition-colors group ${
          activeId === conv.id && !selectMode
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
    </div>
  );

  const groupNames = Object.keys(grouped.groups).sort();

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        {!selectMode ? (
          <button
            onClick={() => setSelectMode(true)}
            className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Select conversations…
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground flex-1">
              {selectedIds.size} selected
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={selectedIds.size === 0}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground disabled:opacity-40"
                  title="Move to group"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[140px]">
                {allGroups.map((g) => (
                  <DropdownMenuItem key={g} onClick={() => handleMove(g)}>
                    <Folder className="w-3.5 h-3.5 mr-2" />
                    {g}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => handleMove(undefined)}>
                  <X className="w-3.5 h-3.5 mr-2" />
                  Ungrouped
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={handleDelete}
              disabled={selectedIds.size === 0}
              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-destructive disabled:opacity-40"
              title="Delete selected"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={exitSelectMode}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
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
