import { Card, CardContent } from "@/components/ui/card";
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
  if (ms === 0)   return undefined;  // shows "—", no color
  if (ms < 50)    return "#10b981";  // emerald — fast
  if (ms < 300)   return "#f59e0b";  // amber   — normal
  return "#ef4444";                  // red     — slow
}

function Metric({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="text-lg font-bold tabular-nums leading-none"
        style={{ color: valueColor }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-xs text-muted-foreground/70 leading-none mt-0.5">{sub}</span>
      )}
    </div>
  );
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
    <Card className="rounded-none border-l border-t-0 border-r-0 border-b-0 h-full flex flex-col gap-0 py-0">
      <CardContent className="flex flex-col gap-5 p-5">

        {/* Header with live status dot */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Performance
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: isLoading ? "#f59e0b" : "#10b981" }}
            />
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Generating dataset…" : "Live metrics"}
            </p>
          </div>
        </div>

        <Separator />

        {/* Metrics */}
        <div className="flex flex-col gap-4">
          <Metric
            label="Last operation"
            value={lastOperationMs === 0 ? "—" : `${lastOperationMs.toFixed(1)} ms`}
            valueColor={operationColor(lastOperationMs)}
          />
          <Metric
            label="Total items"
            value={totalItems.toLocaleString()}
          />
          <Metric
            label="Visible in DOM"
            value={visibleItems.toLocaleString()}
            sub={domSaved > 0 ? `${domSaved.toLocaleString()} nodes saved` : undefined}
          />
        </div>

        <Separator />

        {/* Toggles */}
        <div className="flex flex-col gap-4">
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

        {/* Mode indicators — dot + label */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: virtualized ? "#10b981" : "#6b7280" }}
            />
            <span className={virtualized ? "text-foreground font-medium" : "text-muted-foreground line-through"}>
              Virtualized rendering
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: workerEnabled ? "#10b981" : "#6b7280" }}
            />
            <span className={workerEnabled ? "text-foreground font-medium" : "text-muted-foreground line-through"}>
              Off-thread processing
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
