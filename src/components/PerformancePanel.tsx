import { Activity, Cpu, Layers } from "lucide-react";
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
  workerBusy: boolean;
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
  workerBusy,
  onVirtualizationChange,
  onWorkerChange,
}: PerformancePanelProps) {
  const domSaved = totalItems > 0 ? totalItems - visibleItems : 0;
  const domEfficiency = totalItems > 0 ? Math.round((domSaved / totalItems) * 100) : 0;
  const busy = isLoading || workerBusy;

  return (
    <Card className="rounded-none border-l border-t-0 border-r-0 border-b-0 h-full flex flex-col gap-0 py-0 overflow-y-auto">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Metrics
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${busy ? "animate-pulse" : ""}`}
            style={{ backgroundColor: busy ? "#f59e0b" : "#10b981" }}
          />
          <span className="text-[11px] text-muted-foreground">
            {isLoading ? "Generating…" : workerBusy ? "Processing…" : "Ready"}
          </span>
        </div>
      </div>

      <Separator />

      {/* ── Stats ── */}
      <div className="px-4 py-4 flex flex-col gap-2.5 shrink-0">

        {/* Last operation */}
        <div className="rounded-lg bg-muted/50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
            Last operation
          </p>
          <p
            className="text-2xl font-bold tabular-nums leading-none"
            style={{ color: operationColor(lastOperationMs) }}
          >
            {lastOperationMs === 0 ? (
              <span className="text-muted-foreground/50 text-lg font-normal">—</span>
            ) : (
              <>
                {lastOperationMs.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
              </>
            )}
          </p>
        </div>

        {/* Total + In DOM */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Total</p>
            <p className="text-sm font-bold tabular-nums leading-none">
              {totalItems.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">In DOM</p>
            <p className="text-sm font-bold tabular-nums leading-none">
              {visibleItems.toLocaleString()}
            </p>
            {domSaved > 0 && (
              <p className="text-[10px] font-medium leading-none mt-1" style={{ color: "#10b981" }}>
                −{domSaved.toLocaleString()} skipped
              </p>
            )}
          </div>
        </div>

        {/* DOM efficiency bar — only meaningful when virtualized */}
        {virtualized && domEfficiency > 0 && (
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">DOM saved</p>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: "#10b981" }}>
                {domEfficiency}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${domEfficiency}%`, backgroundColor: "#10b981" }}
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* ── Toggles ── */}
      <div className="px-4 py-4 flex flex-col gap-5 shrink-0">

        {/* Virtualization */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                  virtualized ? "bg-emerald-500/15" : "bg-muted"
                }`}
              >
                <Layers
                  className={`h-3.5 w-3.5 transition-colors ${
                    virtualized ? "text-emerald-500" : "text-muted-foreground"
                  }`}
                />
              </div>
              <Label htmlFor="virtualization-toggle" className="text-sm font-medium cursor-pointer">
                Virtualization
              </Label>
            </div>
            <Switch
              id="virtualization-toggle"
              checked={virtualized}
              onCheckedChange={onVirtualizationChange}
            />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground pl-8">
            {virtualized
              ? `${visibleItems} of ${totalItems.toLocaleString()} nodes in viewport`
              : "All nodes mounted — scroll to feel the difference"}
          </p>
        </div>

        {/* Web Worker */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                  workerEnabled ? "bg-blue-500/15" : "bg-muted"
                }`}
              >
                <Cpu
                  className={`h-3.5 w-3.5 transition-colors ${
                    workerEnabled ? "text-blue-500" : "text-muted-foreground"
                  }`}
                />
              </div>
              <Label htmlFor="worker-toggle" className="text-sm font-medium cursor-pointer">
                Web Worker
              </Label>
            </div>
            <Switch
              id="worker-toggle"
              checked={workerEnabled}
              onCheckedChange={onWorkerChange}
            />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground pl-8">
            {workerEnabled
              ? "Filter & search run off the main thread"
              : "Main-thread processing — try searching"}
          </p>
        </div>
      </div>

      <Separator />

      {/* ── Active modes ── */}
      <div className="px-4 py-4 flex flex-col gap-2 shrink-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Active</p>
        <div className="flex flex-col gap-1.5">
          <span
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              virtualized
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted/60 text-muted-foreground"
            }`}
          >
            <Layers className="h-3 w-3 shrink-0" />
            {virtualized ? "Virtualized rendering" : "Naive rendering"}
          </span>
          <span
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              workerEnabled
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "bg-muted/60 text-muted-foreground"
            }`}
          >
            <Cpu className="h-3 w-3 shrink-0" />
            {workerEnabled ? "Off-thread processing" : "Main-thread processing"}
          </span>
        </div>
      </div>
    </Card>
  );
}
