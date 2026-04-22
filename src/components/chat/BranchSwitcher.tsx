import { ChevronLeft, ChevronRight } from "lucide-react";

interface BranchSwitcherProps {
  index: number; // 0-based
  total: number;
  onChange: (newIndex: number) => void;
}

/** Small inline ‹ 1/2 › control shown on messages whose parent has multiple children. */
export function BranchSwitcher({ index, total, onChange }: BranchSwitcherProps) {
  if (total <= 1) return null;
  return (
    <div className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-secondary/60 rounded px-1 py-0.5 ml-1">
      <button
        onClick={() => onChange((index - 1 + total) % total)}
        className="hover:text-foreground transition-colors"
        aria-label="Previous branch"
      >
        <ChevronLeft className="w-3 h-3" />
      </button>
      <span className="font-mono tabular-nums">
        {index + 1}/{total}
      </span>
      <button
        onClick={() => onChange((index + 1) % total)}
        className="hover:text-foreground transition-colors"
        aria-label="Next branch"
      >
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
