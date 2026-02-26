import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface PerformancePanelProps {
  lastOperationMs: number;
  totalItems: number;
  visibleItems: number;
  virtualized: boolean;
  workerEnabled: boolean;
  isLoading: boolean;
  onVirtualizationChange: (value: boolean) => void;
  onWorkerChange: (value: boolean) => void;
}

function operationColor(ms: number): string | undefined {
  if (ms === 0)  return undefined;
  if (ms < 50)   return "#10b981";
  if (ms < 300)  return "#f59e0b";
  return "#ef4444";
}

export function PerformancePanel({
  lastOperationMs,
  totalItems,
  visibleItems,
  virtualized,
  workerEnabled,
  isLoading,
  onVirtualizationChange,
  onWorkerChange,
}: PerformancePanelProps) {
  const domSaved = totalItems > 0 ? totalItems - visibleItems : 0;

  return (
    <Card className="rounded-none border-l border-t-0 border-r-0 border-b-0 h-full flex flex-col gap-0 py-0 overflow-y-auto">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Performance
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${isLoading ? "animate-pulse" : ""}`}
            style={{ backgroundColor: isLoading ? "#f59e0b" : "#10b981" }}
          />
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Generating…" : "Live"}
          </span>
        </div>
      </div>

      <Separator />

      <div className="px-4 py-4 flex flex-col gap-2.5">
        <div className="rounded-lg bg-muted/50 px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
            Last operation
          </p>
          <p
            className="text-2xl font-bold tabular-nums leading-none"
            style={{ color: operationColor(lastOperationMs) }}
          >
            {lastOperationMs === 0 ? (
              <span className="text-muted-foreground/60">—</span>
            ) : (
              <>
                {lastOperationMs.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Total</p>
            <p className="text-base font-bold tabular-nums leading-none">
              {totalItems.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">In DOM</p>
            <p className="text-base font-bold tabular-nums leading-none">
              {visibleItems.toLocaleString()}
            </p>
            {domSaved > 0 && (
              <p className="text-[10px] font-medium leading-none mt-1" style={{ color: "#10b981" }}>
                -{domSaved.toLocaleString()} saved
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="virtualization-toggle" className="text-sm cursor-pointer">
            Virtualization
          </Label>
          <Switch
            id="virtualization-toggle"
            checked={virtualized}
            onCheckedChange={onVirtualizationChange}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="worker-toggle" className="text-sm cursor-pointer">
            Web Worker
          </Label>
          <Switch
            id="worker-toggle"
            checked={workerEnabled}
            onCheckedChange={onWorkerChange}
          />
        </div>
      </div>

      <Separator />

      <div className="px-4 py-4 flex flex-col gap-2">
        <span
          className={`self-start text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
            virtualized
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-muted/60 text-muted-foreground line-through"
          }`}
        >
          Virtualized rendering
        </span>
        <span
          className={`self-start text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
            workerEnabled
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-muted/60 text-muted-foreground line-through"
          }`}
        >
          Off-thread processing
        </span>
      </div>
    </Card>
  );
}
