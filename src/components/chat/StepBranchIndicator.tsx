import { ChevronLeft, ChevronRight, GitBranch } from "lucide-react";
import { StepBranches } from "@/types/agent";

interface StepBranchIndicatorProps {
  branches?: StepBranches;
  onChange?: (newIndex: number) => void;
}

/** Inline badge showing variants for a step. Clickable arrows when `onChange` is provided. */
export function StepBranchIndicator({ branches, onChange }: StepBranchIndicatorProps) {
  if (!branches || branches.variants.length <= 1) return null;
  const { selectedIndex, variants } = branches;
  const total = variants.length;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  if (!onChange) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[10px] text-primary bg-primary/10 rounded px-1 py-0.5 font-mono tabular-nums"
        title={`${total} variants for this step`}
      >
        <GitBranch className="w-2.5 h-2.5" />
        {selectedIndex + 1}/{total}
      </span>
    );
  }

  return (
    <span
      onClick={stop}
      className="inline-flex items-center gap-0.5 text-[10px] text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded px-1 py-0.5 font-mono tabular-nums"
      title={`${total} variants for this step`}
    >
      <button
        onClick={(e) => {
          stop(e);
          onChange((selectedIndex - 1 + total) % total);
        }}
        className="hover:text-foreground transition-colors"
        aria-label="Previous variant"
      >
        <ChevronLeft className="w-2.5 h-2.5" />
      </button>
      <GitBranch className="w-2.5 h-2.5" />
      <span>
        {selectedIndex + 1}/{total}
      </span>
      <button
        onClick={(e) => {
          stop(e);
          onChange((selectedIndex + 1) % total);
        }}
        className="hover:text-foreground transition-colors"
        aria-label="Next variant"
      >
        <ChevronRight className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}
