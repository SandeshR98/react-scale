import { Skeleton } from "@/components/ui/skeleton";
import type { ViewMode } from "./ProductCard";

export function skeletonFor(mode: ViewMode) {
  if (mode === "grid") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: 8 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-xl border border-border/60 overflow-hidden shadow-sm" style={{ height: 340 }}>
            <Skeleton className="w-full shrink-0 rounded-none" style={{ height: 180 }} />
            <div className="flex flex-col flex-1 p-3 gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-2/5 mt-0.5" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "table") {
    return (
      <div className="flex flex-col">
        <div className="flex gap-3 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0 items-center">
          <Skeleton className="h-4 w-8 shrink-0" />
          <Skeleton className="h-4 flex-2" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-14 shrink-0" />
        </div>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex gap-3 px-4 items-center border-b border-border/30" style={{ height: 52 }}>
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-2 flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-5 w-1/3 rounded-full" />
            </div>
            <Skeleton className="h-5 flex-1 rounded" />
            <Skeleton className="h-5 flex-1 rounded" />
            <div className="flex-1 flex flex-col gap-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-5 flex-1 rounded" />
            <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex rounded-xl border border-border/60 overflow-hidden shadow-sm" style={{ height: 120 }}>
          <Skeleton className="w-30 shrink-0 rounded-none" />
          <div className="w-px bg-border/40 self-stretch shrink-0" />
          <div className="flex flex-1 min-w-0 items-center gap-4 px-4 py-2">
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/3 rounded-full" />
            </div>
            <div className="shrink-0 flex flex-col gap-1.5 items-end">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="w-px h-12 bg-border/40 shrink-0" />
            <div className="min-w-14 flex flex-col gap-1.5 items-center">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="min-w-16 flex flex-col gap-1.5 items-center">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="flex flex-col gap-1.5 items-center shrink-0">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
