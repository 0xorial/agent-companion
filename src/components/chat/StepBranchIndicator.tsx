import { GitBranch } from "lucide-react";
import { StepBranches } from "@/types/agent";

interface StepBranchIndicatorProps {
  branches?: StepBranches;
}

/** Read-only inline badge showing how many variants exist for a step. */
export function StepBranchIndicator({ branches }: StepBranchIndicatorProps) {
  if (!branches || branches.variants.length <= 1) return null;
  const { selectedIndex, variants } = branches;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] text-primary bg-primary/10 rounded px-1 py-0.5 font-mono tabular-nums"
      title={`${variants.length} variants for this step`}
    >
      <GitBranch className="w-2.5 h-2.5" />
      {selectedIndex + 1}/{variants.length}
    </span>
  );
}
