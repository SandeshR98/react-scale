import { useMemo, useRef, useState, startTransition } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
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

type ProductTableProps = {
  products: Product[];
  onVisibleCountChange?: (count: number) => void;
  onRowClick?: (product: Product) => void;
};

export function ProductTable({ products, onVisibleCountChange, onRowClick }: ProductTableProps) {
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

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => TABLE_ROW_HEIGHT,
    overscan: 10,
    onChange: (instance) => {
      onVisibleCountChange?.(instance.getVirtualItems().length);
    },
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={scrollRef}
      style={{ height: "100%", overflowY: "auto", backgroundColor: "hsl(var(--muted) / 0.25)" }}
    >
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
          style={{ display: "grid", height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
        >
          {virtualItems.map((virtualRow) => {
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
          })}
        </TableBody>
      </table>
    </div>
  );
}
