import { cn } from "@/lib/utils";
import { getBinStatus, getBinStatusLabel } from "@/data/mockData";

interface BinStatusBadgeProps {
  fillLevel: number;
  showLevel?: boolean;
  size?: "sm" | "md";
}

export function BinStatusBadge({ fillLevel, showLevel = true, size = "md" }: BinStatusBadgeProps) {
  const status = getBinStatus(fillLevel);
  const label = getBinStatusLabel(fillLevel);

  const statusColors = {
    green: "bg-success/10 text-success border-success/30",
    yellow: "bg-warning/10 text-warning border-warning/30",
    red: "bg-destructive/10 text-destructive border-destructive/30",
  };

  const dotColors = {
    green: "bg-success",
    yellow: "bg-warning",
    red: "bg-destructive",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        statusColors[status],
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[status], status === "red" && "animate-pulse-slow")} />
      {label}
      {showLevel && <span className="font-mono">{fillLevel}%</span>}
    </span>
  );
}
