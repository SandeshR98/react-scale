import { startTransition, useCallback, useDeferredValue, useEffect, useReducer, useRef, useState, useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "./components/FilterBar";
import { PerformancePanel } from "./components/PerformancePanel";
import { ProductList } from "./components/ProductList";
import { generateProducts } from "./data/generator";
import { filterProducts } from "./data/operations";
import type { Product } from "./types/product";
import type { ViewMode } from "./components/ProductCard";
import { useWorker } from "./hooks/useWorker";
import type { WorkerResponse } from "./workers/protocol";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface AppState {
  workerEnabled: boolean;
  virtualized: boolean;
  displayedProducts: Product[];
  lastOperationMs: number;
  isLoading: boolean;
}

type AppAction =
  | { type: "SET_WORKER_MODE"; value: boolean }
  | { type: "SET_VIRTUALIZATION"; value: boolean }
  | { type: "SET_DATASET"; products: Product[] }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_OPERATION_TIME"; ms: number };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_WORKER_MODE":
      return { ...state, workerEnabled: action.value };
    case "SET_VIRTUALIZATION":
      return { ...state, virtualized: action.value };
    case "SET_DATASET":
      return { ...state, displayedProducts: action.products, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.value };
    case "SET_OPERATION_TIME":
      return { ...state, lastOperationMs: action.ms };
  }
}

const INITIAL_STATE: AppState = {
  workerEnabled: true,
  virtualized: true,
  displayedProducts: [],
  lastOperationMs: 0,
  isLoading: true,
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  // Full 100K dataset stored in a ref — never causes re-renders on its own
  const fullDatasetRef = useRef<Product[]>([]);

  // Track visible item count from ProductList virtualizer
  const [visibleCount, setVisibleCount] = useState(0);

  // List / grid / table view toggle
  // useTransition marks the view switch as non-urgent so React keeps the current
  // view visible while the new one (e.g. table's getCoreRowModel) initialises.
  const [isViewTransitioning, startViewTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    startViewTransition(() => setViewMode(mode));
  }, []);

  // Track current filter params to re-run when worker toggle changes
  const filterRef = useRef({ query: "", category: "" });

  // Ref-tracked so handleFilter can read the latest value without recreating
  const workerEnabledRef = useRef(state.workerEnabled);
  workerEnabledRef.current = state.workerEnabled;

  // Operation start time for perf measurement
  const opStartRef = useRef<number>(0);

  // When the short-circuit path serves fullDatasetRef directly, any in-flight
  // worker FILTER/SORT response that arrives afterward should be discarded.
  const ignoreNextWorkerResultRef = useRef(false);

  const { dispatch: workerDispatch, lastResponse } = useWorker();

  // Deferred copy of the virtualized flag — React renders the heavy list change
  // in the background while the switch flips immediately (urgent update).
  const deferredVirtualized = useDeferredValue(state.virtualized);
  const isVizTransitioning = deferredVirtualized !== state.virtualized;

  // ---------------------------------------------------------------------------
  // Handle worker responses
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!lastResponse) return;

    const elapsed = performance.now() - opStartRef.current;

    switch (lastResponse.type) {
      case "GENERATE": {
        const data = (lastResponse as Extract<WorkerResponse, { type: "GENERATE" }>).data;
        fullDatasetRef.current = data;
        dispatch({ type: "SET_DATASET", products: data });
        dispatch({ type: "SET_OPERATION_TIME", ms: elapsed });
        break;
      }
      case "FILTER": {
        if (ignoreNextWorkerResultRef.current) {
          ignoreNextWorkerResultRef.current = false;
          break;
        }
        // Worker transferred a Uint32Array of matching indices (zero-copy).
        // Reconstruct the Product[] from the cached full dataset using those indices.
        const { indices } = lastResponse as Extract<WorkerResponse, { type: "FILTER" }>;
        const data = Array.from(indices, (i) => fullDatasetRef.current[i]);
        dispatch({ type: "SET_DATASET", products: data });
        dispatch({ type: "SET_OPERATION_TIME", ms: elapsed });
        break;
      }
      case "SORT": {
        if (ignoreNextWorkerResultRef.current) {
          ignoreNextWorkerResultRef.current = false;
          break;
        }
        const sortData = (lastResponse as Extract<WorkerResponse, { type: "SORT" }>).data;
        dispatch({ type: "SET_DATASET", products: sortData });
        dispatch({ type: "SET_OPERATION_TIME", ms: elapsed });
        break;
      }
    }
  }, [lastResponse]);

  // ---------------------------------------------------------------------------
  // Initial dataset generation
  // ---------------------------------------------------------------------------

  useEffect(() => {
    dispatch({ type: "SET_LOADING", value: true });
    opStartRef.current = performance.now();

    if (state.workerEnabled) {
      workerDispatch({ type: "GENERATE", payload: { count: 100_000 } });
    } else {
      const start = performance.now();
      const data = generateProducts(100_000);
      const elapsed = performance.now() - start;
      fullDatasetRef.current = data;
      dispatch({ type: "SET_DATASET", products: data });
      dispatch({ type: "SET_OPERATION_TIME", ms: elapsed });
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Filter handler (called by FilterBar)
  // ---------------------------------------------------------------------------

  // Stable callback — reads workerEnabledRef so it never recreates due to mode changes.
  // FilterBar's debounce effect won't re-fire spuriously when the worker toggle changes.
  const handleFilter = useCallback(
    (query: string, category: string) => {
      filterRef.current = { query, category };

      // Dataset not ready yet (called during loading) — skip
      if (fullDatasetRef.current.length === 0) return;

      // No filter active — serve full dataset directly, no worker round-trip needed
      if (query === "" && category === "") {
        ignoreNextWorkerResultRef.current = true; // discard any in-flight FILTER response
        dispatch({ type: "SET_DATASET", products: fullDatasetRef.current });
        dispatch({ type: "SET_OPERATION_TIME", ms: 0 });
        return;
      }

      opStartRef.current = performance.now();
      ignoreNextWorkerResultRef.current = false; // this new worker request should be applied

      if (workerEnabledRef.current) {
        // Worker uses its cached dataset — no serialization overhead on send or receive
        workerDispatch({ type: "FILTER", payload: { query, category } });
      } else {
        const start = performance.now();
        const result = filterProducts(fullDatasetRef.current, query, category);
        const elapsed = performance.now() - start;
        dispatch({ type: "SET_DATASET", products: result });
        dispatch({ type: "SET_OPERATION_TIME", ms: elapsed });
      }
    },
    [workerDispatch]
  );

  // ---------------------------------------------------------------------------
  // Toggle handlers
  // ---------------------------------------------------------------------------

  const handleVirtualizationChange = useCallback((value: boolean) => {
    dispatch({ type: "SET_VIRTUALIZATION", value });
  }, []);

  const handleWorkerChange = useCallback(
    (value: boolean) => {
      if (!value) {
        // Disabling worker — discard any in-flight FILTER/SORT from the worker
        ignoreNextWorkerResultRef.current = true;
      }
      dispatch({ type: "SET_WORKER_MODE", value });
      // Re-run current filter synchronously to get the result, then apply the
      // heavy SET_DATASET render as a transition so the toggle responds instantly.
      const { query, category } = filterRef.current;
      const start = performance.now();
      const result = filterProducts(fullDatasetRef.current, query, category);
      const elapsed = performance.now() - start;
      startTransition(() => {
        dispatch({ type: "SET_DATASET", products: result });
        dispatch({ type: "SET_OPERATION_TIME", ms: elapsed });
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-none tracking-tight">ReactScale</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              100K virtualized product explorer
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar
          onFilter={handleFilter}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />

        {/* Result count bar */}
        {!state.isLoading && (
          <div className="px-4 py-1.5 border-b border-border/50 bg-muted/20 shrink-0 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {state.displayedProducts.length.toLocaleString()} result
              {state.displayedProducts.length !== 1 ? "s" : ""}
            </span>
            {state.displayedProducts.length < 100_000 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                filtered
              </span>
            )}
          </div>
        )}

        {/* Product list */}
        <div
          className="flex-1 min-h-0 overflow-hidden"
          style={{
            opacity: (isVizTransitioning || isViewTransitioning) ? 0.4 : 1,
            transition: "opacity 200ms ease",
            pointerEvents: (isVizTransitioning || isViewTransitioning) ? "none" : undefined,
          }}
        >
          {state.isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-30 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <ProductList
              products={state.displayedProducts}
              virtualized={deferredVirtualized}
              viewMode={viewMode}
              onVisibleCountChange={setVisibleCount}
            />
          )}
        </div>
      </div>

      {/* Performance panel sidebar */}
      <div className="w-56 shrink-0">
        <PerformancePanel
          lastOperationMs={state.lastOperationMs}
          totalItems={state.displayedProducts.length}
          visibleItems={deferredVirtualized ? visibleCount : state.displayedProducts.length}
          virtualized={state.virtualized}
          workerEnabled={state.workerEnabled}
          isLoading={state.isLoading}
          onVirtualizationChange={handleVirtualizationChange}
          onWorkerChange={handleWorkerChange}
        />
      </div>
    </div>
  );
}
