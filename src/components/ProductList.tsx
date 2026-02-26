import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Product } from "../types/product";
import { ProductCard, type ViewMode } from "./ProductCard";
import { ProductTable } from "./ProductTable";

const LIST_CARD_HEIGHT = 120;
const LIST_GAP = 8;
const LIST_ROW_HEIGHT = LIST_CARD_HEIGHT + LIST_GAP;
const GRID_CARD_HEIGHT = 340;
const GRID_COLS = 3;
const GRID_GAP = 8;
const GRID_ROW_HEIGHT = GRID_CARD_HEIGHT + GRID_GAP;
const OVERSCAN = 5;
const NAIVE_CAP = 5_000;
// Each chunk is a separate macrotask — 500 items × ~0.1ms each ≈ 50ms per chunk.
const CHUNK_SIZE = 500;

// Memoized chunk component. When a new chunk is appended, every existing
// NaiveChunk bails out of re-rendering because its props haven't changed.
// This reduces reconciliation per tick from O(total) → O(chunk_size).
const NaiveChunk = memo(function NaiveChunk({
  items,
  isGrid,
  onClick,
}: {
  items: Product[];
  isGrid: boolean;
  onClick: (p: Product) => void;
}) {
  if (isGrid) {
    return (
      <>
        {items.map((product) => (
          <div key={product.id} style={{ height: GRID_CARD_HEIGHT }}>
            <ProductCard product={product} viewMode="grid" onClick={onClick} />
          </div>
        ))}
      </>
    );
  }
  return (
    <>
      {items.map((product) => (
        <div key={product.id} style={{ padding: `${LIST_GAP / 2}px 8px`, height: LIST_ROW_HEIGHT }}>
          <ProductCard product={product} viewMode="list" onClick={onClick} />
        </div>
      ))}
    </>
  );
});

interface ProductListProps {
  products: Product[];
  virtualized: boolean;
  viewMode: ViewMode;
  onVisibleCountChange?: (count: number) => void;
  /** Skeleton shown while the first naive chunk is mounting. */
  loadingFallback?: ReactNode;
  /** Lifted to App so opening a modal doesn't re-render this component. */
  onProductClick?: (product: Product) => void;
}

// memo() ensures ProductList skips reconciliation when only unrelated App
// state changes (e.g. selectedProduct for the modal).
export const ProductList = memo(function ProductList({
  products,
  virtualized,
  viewMode,
  onVisibleCountChange,
  loadingFallback,
  onProductClick,
}: ProductListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isGrid = viewMode === "grid";

  // Once the table view is visited for the first time, keep ProductTable mounted
  // (just hidden) so useReactTable's getCoreRowModel never re-runs on re-entry.
  const hasVisitedTableRef = useRef(false);
  if (viewMode === "table") hasVisitedTableRef.current = true;

  // Stable card-click handler — NaiveChunk's memo depends on this being stable.
  const handleCardClick = useCallback((p: Product) => {
    onProductClick?.(p);
  }, [onProductClick]);

  // readyChunks === 0  → skeleton showing, chunks haven't started mounting
  // readyChunks 1..N-1 → chunks loading progressively
  // readyChunks === N  → all chunks mounted, full list visible
  const [readyChunks, setReadyChunks] = useState(0);

  const allChunks = useMemo(() => {
    const items = products.slice(0, NAIVE_CAP);
    const result: Product[][] = [];
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      result.push(items.slice(i, i + CHUNK_SIZE));
    }
    return result;
  }, [products]);

  const rowCount = isGrid
    ? Math.ceil(products.length / GRID_COLS)
    : products.length;

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: (virtualized && viewMode !== "table") ? rowCount : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (isGrid ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT),
    overscan: OVERSCAN,
    onChange: (instance) => {
      const rows = instance.getVirtualItems().length;
      onVisibleCountChange?.(isGrid ? Math.min(rows * GRID_COLS, products.length) : rows);
    },
  });

  // Reset scroll to top when view mode or result set changes.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [viewMode, products]);

  // Reset chunk progress whenever we (re-)enter naive mode or the product set
  // changes, so we always start fresh from the skeleton.
  useEffect(() => {
    if (!virtualized && viewMode !== "table") {
      setReadyChunks(0);
    }
  }, [virtualized, viewMode, products]);

  // Progressive chunk mounting strategy:
  //   setTimeout(0)      → schedules a new macrotask, giving the browser a
  //                         chance to flush the event queue (clicks, key presses)
  //                         between every chunk.
  //   startTransition()  → marks the state update as non-urgent so React can
  //                         interrupt it for higher-priority work (toggle clicks).
  useEffect(() => {
    if (virtualized || viewMode === "table") return;
    if (readyChunks >= allChunks.length) return;

    const id = setTimeout(() => {
      startTransition(() => {
        setReadyChunks((c) => Math.min(c + 1, allChunks.length));
      });
    }, 0);

    return () => clearTimeout(id);
  }, [virtualized, viewMode, readyChunks, allChunks]);

  // Report live visible count to the PerformancePanel.
  useEffect(() => {
    if (!virtualized && viewMode !== "table") {
      const mounted = allChunks
        .slice(0, readyChunks)
        .reduce((s, c) => s + c.length, 0);
      onVisibleCountChange?.(mounted);
    }
  }, [virtualized, viewMode, readyChunks, allChunks, onVisibleCountChange]);

  let listGridContent: ReactNode;

  if (virtualized) {
    const virtualItems = virtualizer.getVirtualItems();
    listGridContent = (
      <div
        ref={scrollRef}
        style={{ height: "100%", overflowY: "auto", backgroundColor: "hsl(var(--muted) / 0.25)" }}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualItems.map((row) => {
            if (isGrid) {
              const startIdx = row.index * GRID_COLS;
              const rowItems = products.slice(startIdx, startIdx + GRID_COLS);
              return (
                <div
                  key={row.key}
                  style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: GRID_ROW_HEIGHT,
                    transform: `translateY(${row.start}px)`,
                    padding: `0 ${GRID_GAP}px`, paddingBottom: GRID_GAP,
                    display: "grid",
                    gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                    gap: GRID_GAP,
                  }}
                >
                  {rowItems.map((product) => (
                    <ProductCard key={product.id} product={product} viewMode="grid" onClick={handleCardClick} />
                  ))}
                </div>
              );
            }
            return (
              <div
                key={row.key}
                style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  height: LIST_ROW_HEIGHT,
                  transform: `translateY(${row.start}px)`,
                  padding: `${LIST_GAP / 2}px 8px`,
                }}
              >
                <ProductCard product={products[row.index]} viewMode="list" onClick={handleCardClick} />
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (readyChunks === 0) {
    // No chunks mounted yet — show skeleton while the first setTimeout fires.
    listGridContent = (
      <div style={{ height: "100%", overflowY: "auto", backgroundColor: "hsl(var(--muted) / 0.25)" }}>
        {loadingFallback}
      </div>
    );
  } else {
    const isNaiveLoading = readyChunks < allChunks.length;
    const mountedCount = allChunks
      .slice(0, readyChunks)
      .reduce((s, c) => s + c.length, 0);
    const totalToLoad = Math.min(NAIVE_CAP, products.length);
    const capped = products.length > NAIVE_CAP;

    listGridContent = (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "hsl(var(--muted) / 0.25)" }}>
        {/* Pinned banner — stays fixed above the scroll area */}
        <div className="px-3 py-1.5 mx-2 mt-2 mb-1 shrink-0 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {isNaiveLoading ? (
            <>
              ⏳ Loading {mountedCount.toLocaleString()} / {totalToLoad.toLocaleString()} nodes…
              <span className="ml-2 text-destructive/60 tabular-nums">
                ({Math.round((mountedCount / totalToLoad) * 100)}%)
              </span>
            </>
          ) : (
            <>
              ⚠ Virtualization OFF — {totalToLoad.toLocaleString()} nodes in DOM
              {capped && (
                <span className="ml-1 text-destructive/70">
                  (capped from {products.length.toLocaleString()} — enable virtualization to see all)
                </span>
              )}
            </>
          )}
        </div>
        {/* scrollRef reused here so the scroll-reset effect fires correctly */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
          {isGrid ? (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: GRID_GAP, padding: GRID_GAP }}>
              {allChunks.slice(0, readyChunks).map((chunk, i) => (
                <NaiveChunk key={i} items={chunk} isGrid={true} onClick={handleCardClick} />
              ))}
            </div>
          ) : (
            <div>
              {allChunks.slice(0, readyChunks).map((chunk, i) => (
                <NaiveChunk key={i} items={chunk} isGrid={false} onClick={handleCardClick} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", position: "relative" }}>
      {/*
       * ProductTable is lazily mounted on the first visit to table mode, then
       * kept alive using visibility:hidden so the scroll container retains its
       * measured dimensions and TanStack Virtual never re-initialises.
       */}
      {hasVisitedTableRef.current && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            visibility: viewMode === "table" ? "visible" : "hidden",
            pointerEvents: viewMode === "table" ? "auto" : "none",
          }}
        >
          <ProductTable
            products={products}
            onVisibleCountChange={viewMode === "table" ? onVisibleCountChange : undefined}
            onRowClick={onProductClick}
          />
        </div>
      )}

      {viewMode !== "table" && listGridContent}
    </div>
  );
});
