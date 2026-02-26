import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useReducer,
  useRef,
  useState,
  useTransition,
} from "react";
import { ShoppingBag, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "./components/FilterBar";
import { PerformancePanel } from "./components/PerformancePanel";
import { ProductList } from "./components/ProductList";
import { generateProducts } from "./data/generator";
import { filterProducts } from "./data/operations";
import type { Product } from "./types/product";
import type { ViewMode } from "./components/ProductCard";
import { useWorker } from "./hooks/useWorker";

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

export default function App() {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  // Full 100K dataset in a ref — never triggers re-renders on its own.
  const fullDatasetRef = useRef<Product[]>([]);

  const [visibleCount, setVisibleCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  // useTransition keeps the current view visible while the new layout (e.g.
  // table's getCoreRowModel) initialises in the background.
  const [isViewTransitioning, startViewTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    startViewTransition(() => setViewMode(mode));
  }, []);

  const filterRef = useRef({ query: "", category: "" });

  // Written every render so handleFilter always reads the current value
  // without being recreated when the worker toggle changes — prevents
  // FilterBar's debounce from re-firing spuriously.
  const workerEnabledRef = useRef(state.workerEnabled);
  workerEnabledRef.current = state.workerEnabled;

  const opStartRef = useRef<number>(0);

  // Guards against stale in-flight FILTER responses arriving after the
  // short-circuit (no-filter) path or after the worker is toggled off.
  const ignoreNextWorkerResultRef = useRef(false);

  const { dispatch: workerDispatch, lastResponse } = useWorker();

  // useDeferredValue lets the viz switch flip immediately (urgent) while the
  // list re-renders lazily in the background — no content area dimming needed.
  const deferredVirtualized = useDeferredValue(state.virtualized);

  useEffect(() => {
    if (!lastResponse) return;

    const elapsed = performance.now() - opStartRef.current;

    switch (lastResponse.type) {
      case "GENERATE": {
        // Urgent — replaces the loading skeleton immediately.
        const { data } = lastResponse;
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
        const { indices } = lastResponse;
        const data = Array.from(indices, (i) => fullDatasetRef.current[i]);
        startTransition(() => {
          dispatch({ type: "SET_DATASET", products: data });
          dispatch({ type: "SET_OPERATION_TIME", ms: elapsed });
        });
        break;
      }
      case "SORT": {
        if (ignoreNextWorkerResultRef.current) {
          ignoreNextWorkerResultRef.current = false;
          break;
        }
        const { data } = lastResponse;
        startTransition(() => {
          dispatch({ type: "SET_DATASET", products: data });
          dispatch({ type: "SET_OPERATION_TIME", ms: elapsed });
        });
        break;
      }
    }
  }, [lastResponse]);

  // Generate the initial dataset once on mount.
  useEffect(() => {
    dispatch({ type: "SET_LOADING", value: true });
    opStartRef.current = performance.now();

    if (state.workerEnabled) {
      workerDispatch({ type: "GENERATE", payload: { count: 100_000 } });
    } else {
      const start = performance.now();
      const data = generateProducts(100_000);
      fullDatasetRef.current = data;
      dispatch({ type: "SET_DATASET", products: data });
      dispatch({ type: "SET_OPERATION_TIME", ms: performance.now() - start });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable callback — reads workerEnabledRef so its identity never changes
  // when the worker toggle flips, preventing FilterBar's debounce from re-firing.
  const handleFilter = useCallback(
    (query: string, category: string) => {
      filterRef.current = { query, category };

      if (fullDatasetRef.current.length === 0) return;

      if (query === "" && category === "") {
        ignoreNextWorkerResultRef.current = true;
        startTransition(() => {
          dispatch({ type: "SET_DATASET", products: fullDatasetRef.current });
          dispatch({ type: "SET_OPERATION_TIME", ms: 0 });
        });
        return;
      }

      opStartRef.current = performance.now();
      ignoreNextWorkerResultRef.current = false;

      if (workerEnabledRef.current) {
        workerDispatch({ type: "FILTER", payload: { query, category } });
      } else {
        const start = performance.now();
        const result = filterProducts(fullDatasetRef.current, query, category);
        startTransition(() => {
          dispatch({ type: "SET_DATASET", products: result });
          dispatch({ type: "SET_OPERATION_TIME", ms: performance.now() - start });
        });
      }
    },
    [workerDispatch]
  );

  const handleVirtualizationChange = useCallback((value: boolean) => {
    dispatch({ type: "SET_VIRTUALIZATION", value });
  }, []);

  const handleWorkerChange = useCallback((value: boolean) => {
    if (!value) ignoreNextWorkerResultRef.current = true;
    dispatch({ type: "SET_WORKER_MODE", value });
  }, []);

  // When the worker is disabled, re-apply the current filter on the main thread.
  // Running this in an effect (not the click handler) keeps the toggle instant.
  useEffect(() => {
    if (state.workerEnabled || fullDatasetRef.current.length === 0) return;
    const { query, category } = filterRef.current;
    const start = performance.now();
    const result = filterProducts(fullDatasetRef.current, query, category);
    startTransition(() => {
      dispatch({ type: "SET_DATASET", products: result });
      dispatch({ type: "SET_OPERATION_TIME", ms: performance.now() - start });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.workerEnabled]);

  const panelProps = {
    lastOperationMs: state.lastOperationMs,
    totalItems: state.displayedProducts.length,
    visibleItems: deferredVirtualized ? visibleCount : state.displayedProducts.length,
    virtualized: state.virtualized,
    workerEnabled: state.workerEnabled,
    isLoading: state.isLoading,
    onVirtualizationChange: handleVirtualizationChange,
    onWorkerChange: handleWorkerChange,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-none tracking-tight">ReactScale</h1>
            <p className="text-xs text-muted-foreground mt-0.5">100K virtualized product explorer</p>
          </div>
          <button
            onClick={() => setShowPanel((v) => !v)}
            className="ml-auto lg:hidden rounded-lg p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle metrics panel"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <FilterBar
          onFilter={handleFilter}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />

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

        <div
          className="flex-1 min-h-0 overflow-hidden"
          style={{
            opacity: isViewTransitioning ? 0.4 : 1,
            transition: "opacity 200ms ease",
            pointerEvents: isViewTransitioning ? "none" : undefined,
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

      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:block w-56 shrink-0">
        <PerformancePanel {...panelProps} />
      </div>

      {/* Mobile drawer — slide in from right */}
      {showPanel && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setShowPanel(false)}
        />
      )}
      <div
        className={`
          fixed inset-y-0 right-0 z-50 w-64 lg:hidden
          transition-transform duration-300 ease-in-out
          ${showPanel ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <PerformancePanel {...panelProps} />
      </div>
    </div>
  );
}
