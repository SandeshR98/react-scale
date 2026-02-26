import { memo, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_COLOR,
  productImgUrl,
  stockColor,
  trendVariant,
} from "@/lib/product-utils";
import { Stars } from "./Stars";
import type { Product } from "../types/product";

const TABLE_ROW_HEIGHT = 56;
const NAIVE_CAP = 5_000;
const CHUNK_SIZE = 500;

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc")  return <ChevronUp  className="h-3 w-3 shrink-0 text-foreground" />;
  if (sorted === "desc") return <ChevronDown className="h-3 w-3 shrink-0 text-foreground" />;
  return <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground/40" />;
}

function useColumns(): ColumnDef<Product>[] {
  return useMemo<ColumnDef<Product>[]>(() => [
    {
      id: "id",
      header: "#",
      accessorKey: "id",
      size: 72,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono tabular-nums select-none">
          #{String(row.original.id).padStart(5, "0")}
        </span>
      ),
    },
    {
      id: "image",
      header: "",
      size: 56,
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original;
        const accentColor = CATEGORY_COLOR[product.category] ?? "#6b7280";
        return (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              overflow: "hidden",
              position: "relative",
              flexShrink: 0,
              backgroundColor: `${accentColor}20`,
            }}
          >
            <img
              src={productImgUrl(product.id)}
              alt={product.name}
              loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        );
      },
    },
    {
      id: "name",
      header: "Product",
      accessorKey: "name",
      size: 240,
      cell: ({ row }) => (
        <span
          className="font-medium text-sm text-foreground"
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
        >
          {row.original.name}
        </span>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      size: 140,
      cell: ({ row }) => {
        const cat = row.original.category;
        const color = CATEGORY_COLOR[cat] ?? "#6b7280";
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium"
            style={{ color, borderColor: `${color}45`, backgroundColor: `${color}12` }}
          >
            {cat}
          </Badge>
        );
      },
    },
    {
      id: "price",
      header: "Price",
      accessorKey: "price",
      size: 90,
      cell: ({ row }) => (
        <span className="font-bold tabular-nums text-sm">
          ${row.original.price.toFixed(2)}
        </span>
      ),
    },
    {
      id: "rating",
      header: "Rating",
      accessorKey: "rating",
      size: 130,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Stars rating={row.original.rating} fontSize="0.7rem" />
          <span className="text-xs text-muted-foreground tabular-nums">
            ({row.original.rating.toFixed(1)})
          </span>
        </div>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      accessorKey: "stock",
      size: 85,
      cell: ({ row }) => (
        <span
          className="font-semibold tabular-nums text-sm"
          style={{ color: stockColor(row.original.stock) }}
        >
          {row.original.stock}
        </span>
      ),
    },
    {
      id: "popularity",
      header: "Popularity",
      accessorKey: "popularity",
      size: 105,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-muted-foreground">
          {row.original.popularity.toLocaleString()}
        </span>
      ),
    },
    {
      id: "trendScore",
      header: "Trend",
      accessorKey: "trendScore",
      size: 80,
      cell: ({ row }) => (
        <Badge
          variant={trendVariant(row.original.trendScore)}
          className="tabular-nums font-bold text-xs h-5"
        >
          {row.original.trendScore}
        </Badge>
      ),
    },
  ], []);
}

// Memoized chunk — existing chunks bail out of reconciliation when new ones are
// appended, keeping each incremental step O(CHUNK_SIZE) instead of O(total).
const TableChunk = memo(function TableChunk({
  rows,
  onRowClick,
}: {
  rows: Row<Product>[];
  onRowClick?: (product: Product) => void;
}) {
  return (
    <>
      {rows.map((row) => (
        <TableRow
          key={row.id}
          style={{
            display: "flex",
            width: "100%",
            height: TABLE_ROW_HEIGHT,
            alignItems: "center",
          }}
          className="border-b border-border/50 hover:bg-background/80 transition-colors cursor-pointer"
          onClick={() => onRowClick?.(row.original)}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell
              key={cell.id}
              style={{
                display: "flex",
                alignItems: "center",
                width: cell.column.getSize(),
                overflow: "hidden",
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
});

type ProductTableProps = {
  products: Product[];
  virtualized: boolean;
  onVisibleCountChange?: (count: number) => void;
  onRowClick?: (product: Product) => void;
};

export function ProductTable({ products, virtualized, onVisibleCountChange, onRowClick }: ProductTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useColumns();

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    // startTransition lets React time-slice the 100K-row re-sort so the
    // column header click feels instant rather than blocking for 100-200ms.
    onSortingChange: (updater) => startTransition(() => setSorting(updater)),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  // Pre-split rows into chunks. Recomputed when rows change (new filter/sort).
  const allChunks = useMemo(() => {
    const capped = rows.slice(0, NAIVE_CAP);
    const result: Row<Product>[][] = [];
    for (let i = 0; i < capped.length; i += CHUNK_SIZE) {
      result.push(capped.slice(i, i + CHUNK_SIZE));
    }
    return result;
  }, [rows]);

  // readyChunks === 0  → nothing mounted yet (first render of naive mode)
  // readyChunks 1..N-1 → chunks loading progressively
  // readyChunks === N  → all chunks mounted
  const [readyChunks, setReadyChunks] = useState(0);

  // Reset whenever we enter naive mode or the row set changes (filter/sort).
  useEffect(() => {
    if (!virtualized) {
      setReadyChunks(0);
    }
  }, [virtualized, rows]);

  // Progressive chunk loading — each chunk runs in its own macrotask so the
  // browser can flush the event queue between chunks, keeping controls interactive.
  useEffect(() => {
    if (virtualized) return;
    if (readyChunks >= allChunks.length) return;

    const id = setTimeout(() => {
      startTransition(() => setReadyChunks((c) => Math.min(c + 1, allChunks.length)));
    }, 0);

    return () => clearTimeout(id);
  }, [virtualized, readyChunks, allChunks]);

  // Report naive visible count (mounted rows) to the PerformancePanel.
  useEffect(() => {
    if (!virtualized) {
      const mounted = allChunks.slice(0, readyChunks).reduce((s, c) => s + c.length, 0);
      onVisibleCountChange?.(mounted);
    }
  }, [virtualized, allChunks, readyChunks, onVisibleCountChange]);

  const virtualizer = useVirtualizer({
    count: virtualized ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => TABLE_ROW_HEIGHT,
    overscan: 10,
    onChange: (instance) => {
      if (virtualized) onVisibleCountChange?.(instance.getVirtualItems().length);
    },
  });

  const virtualItems = virtualizer.getVirtualItems();

  const isNaiveLoading = !virtualized && readyChunks < allChunks.length;
  const totalToLoad = Math.min(rows.length, NAIVE_CAP);
  const mountedCount = allChunks.slice(0, readyChunks).reduce((s, c) => s + c.length, 0);
  const capped = !virtualized && rows.length > NAIVE_CAP;

  return (
    <div
      ref={scrollRef}
      style={{ height: "100%", overflowY: "auto", backgroundColor: "hsl(var(--muted) / 0.25)" }}
    >
      {!virtualized && (
        <div className="px-3 py-1.5 mx-2 mt-2 mb-1 shrink-0 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {isNaiveLoading ? (
            <>
              ⏳ Loading {mountedCount.toLocaleString()} / {totalToLoad.toLocaleString()} rows…
              <span className="ml-2 text-destructive/60 tabular-nums">
                ({Math.round((mountedCount / totalToLoad) * 100)}%)
              </span>
            </>
          ) : (
            <>
              ⚠ Virtualization OFF — {totalToLoad.toLocaleString()} rows in DOM
              {capped && (
                <span className="ml-1 text-destructive/70">
                  (capped from {rows.length.toLocaleString()} — enable virtualization to see all)
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/*
       * display:"grid" on <table>/<thead>/<tbody> enables position:sticky on
       * the header and position:absolute on each <tr> for TanStack Virtual.
       * Shadcn table components are used for their class-based styling only.
       */}
      <table style={{ display: "grid", width: "100%", minWidth: "max-content" }}>
        <TableHeader
          style={{ display: "grid", position: "sticky", top: 0, zIndex: 10 }}
          className="bg-background shadow-sm"
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              style={{ display: "flex", width: "100%" }}
              className="hover:bg-transparent border-b border-border"
            >
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const canSort = header.column.getCanSort();
                return (
                  <TableHead
                    key={header.id}
                    style={{ display: "flex", alignItems: "center", gap: 4, width: header.getSize() }}
                    className={canSort ? "cursor-pointer select-none hover:text-foreground" : ""}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    {canSort && <SortIcon sorted={sorted} />}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody
          style={
            virtualized
              ? { display: "grid", height: `${virtualizer.getTotalSize()}px`, position: "relative" }
              : { display: "grid" }
          }
        >
          {virtualized
            ? virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <TableRow
                    key={row.id}
                    style={{
                      display: "flex",
                      position: "absolute",
                      transform: `translateY(${virtualRow.start}px)`,
                      width: "100%",
                      height: TABLE_ROW_HEIGHT,
                      alignItems: "center",
                    }}
                    className="border-b border-border/50 hover:bg-background/80 transition-colors cursor-pointer"
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          width: cell.column.getSize(),
                          overflow: "hidden",
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            : allChunks.slice(0, readyChunks).map((chunk, i) => (
                <TableChunk key={i} rows={chunk} onRowClick={onRowClick} />
              ))
          }
        </TableBody>
      </table>
    </div>
  );
}
