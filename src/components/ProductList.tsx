import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Product } from "../types/product";
import { ProductCard, type ViewMode } from "./ProductCard";
import { ProductTable } from "./ProductTable";
import { ProductModal } from "./ProductModal";

const LIST_CARD_HEIGHT = 120;
const LIST_GAP = 8;
const LIST_ROW_HEIGHT = LIST_CARD_HEIGHT + LIST_GAP; // 128 (card + gap)
const GRID_CARD_HEIGHT = 340;
const GRID_COLS = 3;
const GRID_GAP = 8;
const GRID_ROW_HEIGHT = GRID_CARD_HEIGHT + GRID_GAP; // 348
const OVERSCAN = 5;

interface ProductListProps {
  products: Product[];
  virtualized: boolean;
  viewMode: ViewMode;
  onVisibleCountChange?: (count: number) => void;
}

export function ProductList({
  products,
  virtualized,
  viewMode,
  onVisibleCountChange,
}: ProductListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isGrid = viewMode === "grid";

  // ─── Modal state ─────────────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const handleProductClick = useCallback((p: Product) => setSelectedProduct(p), []);

  const rowCount = isGrid
    ? Math.ceil(products.length / GRID_COLS)
    : products.length;

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    // Table mode uses ProductTable's own virtualizer — keep count 0 here so
    // this virtualizer stays idle while still satisfying rules of hooks.
    count: (virtualized && viewMode !== "table") ? rowCount : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (isGrid ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT),
    overscan: OVERSCAN,
    onChange: (instance) => {
      const rows = instance.getVirtualItems().length;
      onVisibleCountChange?.(isGrid ? Math.min(rows * GRID_COLS, products.length) : rows);
    },
  });

  // Reset scroll to top when view mode or result set changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [viewMode, products]);

  // ─── Build view content ───────────────────────────────────────────────────────
  // Unified single return so the modal is always rendered regardless of view mode.

  let content: React.ReactNode;

  if (viewMode === "table") {
    // ── Table — ProductTable manages its own virtualizer ──
    content = (
      <ProductTable
        products={products}
        onVisibleCountChange={onVisibleCountChange}
        onRowClick={handleProductClick}
      />
    );
  } else if (virtualized) {
    // ── Virtualized list / grid ──
    const virtualItems = virtualizer.getVirtualItems();
    content = (
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
                    <ProductCard key={product.id} product={product} viewMode="grid" onClick={handleProductClick} />
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
                <ProductCard product={products[row.index]} viewMode="list" onClick={handleProductClick} />
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    // ── Non-virtualized (naive, capped) ──
    const NAIVE_CAP = 5_000;
    const naiveItems = products.slice(0, NAIVE_CAP);
    const capped = products.length > NAIVE_CAP;
    content = (
      <div style={{ height: "100%", overflowY: "auto", backgroundColor: "hsl(var(--muted) / 0.25)" }}>
        <div className="px-2 py-1 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded mx-2 mt-2 mb-1">
          ⚠ Virtualization OFF — {naiveItems.length.toLocaleString()} nodes mounted in DOM
          {capped ? ` (capped from ${products.length.toLocaleString()} — enable virtualization to see all)` : ""}. Performance may degrade.
        </div>
        {isGrid ? (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: GRID_GAP, padding: GRID_GAP }}>
            {naiveItems.map((product) => (
              <div key={product.id} style={{ height: GRID_CARD_HEIGHT }}>
                <ProductCard product={product} viewMode="grid" onClick={handleProductClick} />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {naiveItems.map((product) => (
              <div key={product.id} style={{ padding: `${LIST_GAP / 2}px 8px`, height: LIST_ROW_HEIGHT }}>
                <ProductCard product={product} viewMode="list" onClick={handleProductClick} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {content}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
