import { memo } from "react";
import {
  Zap, Shirt, Home, Dumbbell, BookOpen, Gamepad2, Package,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "../types/product";

export type ViewMode = "list" | "grid" | "table";

interface ProductCardProps {
  product: Product;
  viewMode?: ViewMode;
  onClick?: (product: Product) => void;
}

// Category accent colors
const CATEGORY_COLOR: Record<string, string> = {
  "Electronics":   "#3b82f6",
  "Clothing":      "#a855f7",
  "Home & Garden": "#22c55e",
  "Sports":        "#f97316",
  "Books":         "#f59e0b",
  "Toys":          "#ec4899",
};

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  "Electronics":   Zap,
  "Clothing":      Shirt,
  "Home & Garden": Home,
  "Sports":        Dumbbell,
  "Books":         BookOpen,
  "Toys":          Gamepad2,
};

// Picsum seed cycle — 50 seeds across 100K products; browser caches all after first scroll
function productImgUrl(id: number, w: number, h: number): string {
  const seed = (id - 1) % 50;
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

function stockColor(stock: number): string {
  if (stock <= 50)  return "#ef4444";
  if (stock <= 200) return "#f59e0b";
  return "#22c55e";
}

function stockLabel(stock: number): string {
  if (stock <= 50)  return `Only ${stock} left`;
  if (stock <= 200) return `${stock} in stock`;
  return "In stock";
}

function trendVariant(score: number): "default" | "secondary" | "outline" {
  if (score >= 70) return "default";
  if (score >= 30) return "secondary";
  return "outline";
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const filled = Math.round(rating);
  const fontSize = size === "sm" ? "0.7rem" : "0.78rem";
  return (
    <span style={{ display: "inline-flex", gap: 0, lineHeight: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < filled ? "#f59e0b" : "#d1d5db", fontSize }}>★</span>
      ))}
    </span>
  );
}

// ─── Grid card (Amazon/eBay style, ~340px tall) ───────────────────────────────

function GridCard({ product, onClick }: { product: Product; onClick?: () => void }) {
  const accentColor = CATEGORY_COLOR[product.category] ?? "#6b7280";
  const Icon = CATEGORY_ICON[product.category] ?? Package;

  return (
    <Card
      className="flex flex-col overflow-hidden rounded-xl border-border/60 shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      style={{ height: "100%" }}
      onClick={onClick}
    >
      {/* ── Image ── */}
      <div
        style={{
          height: 180,
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          backgroundColor: `${accentColor}18`,
        }}
      >
        {/* Fallback icon — shown until/unless real photo loads */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon className="h-16 w-16" style={{ color: accentColor, opacity: 0.3 }} />
        </div>

        {/* Real product photo */}
        <img
          src={productImgUrl(product.id, 400, 300)}
          alt={product.name}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />

        {/* Category pill over image */}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span
            style={{
              display: "inline-block",
              background: "#fff",
              color: accentColor,
              fontSize: "0.58rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 999,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              border: `1px solid ${accentColor}40`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            {product.category}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-3 gap-1.5 min-h-0">
        {/* Product name — 2-line clamp */}
        <p
          className="font-medium text-sm leading-snug text-foreground"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
            minHeight: "2.5rem",
          }}
        >
          {product.name}
        </p>

        {/* Price */}
        <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
          ${product.price.toFixed(2)}
        </p>

        {/* Stars + rating value */}
        <div className="flex items-center gap-1.5">
          <Stars rating={product.rating} />
          <span className="text-xs text-muted-foreground tabular-nums">
            ({product.rating.toFixed(1)})
          </span>
        </div>

        {/* Stock + trend — bottom row */}
        <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-border/40">
          <span className="flex items-center gap-1.5 text-xs">
            <span style={{ color: stockColor(product.stock), fontSize: "0.45rem" }}>●</span>
            <span
              style={{ color: stockColor(product.stock) }}
              className="font-medium"
            >
              {stockLabel(product.stock)}
            </span>
          </span>
          <Badge variant={trendVariant(product.trendScore)} className="text-xs tabular-nums font-semibold h-5">
            {product.trendScore}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

// ─── List card (Amazon/eBay horizontal style, 120px) ─────────────────────────

function ListCard({ product, onClick }: { product: Product; onClick?: () => void }) {
  const accentColor = CATEGORY_COLOR[product.category] ?? "#6b7280";
  const Icon = CATEGORY_ICON[product.category] ?? Package;

  return (
    <Card
      className="flex flex-row overflow-hidden rounded-xl border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      style={{ height: 120, minHeight: 120, maxHeight: 120 }}
      onClick={onClick}
    >
      {/* Square product image */}
      <div
        style={{
          width: 120,
          height: 120,
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          backgroundColor: `${accentColor}18`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon className="h-8 w-8" style={{ color: accentColor, opacity: 0.35 }} />
        </div>
        <img
          src={productImgUrl(product.id, 200, 200)}
          alt={product.name}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      {/* Divider */}
      <div className="w-px bg-border/40 self-stretch shrink-0" />

      {/* Main content */}
      <div className="flex flex-1 min-w-0 items-center gap-4 px-4 py-2">
        {/* Name + category */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate leading-tight mb-1.5 text-foreground">
            {product.name}
          </p>
          <Badge
            variant="outline"
            className="text-xs font-medium h-5"
            style={{
              color: accentColor,
              borderColor: `${accentColor}45`,
              backgroundColor: `${accentColor}12`,
            }}
          >
            {product.category}
          </Badge>
        </div>

        {/* Price + stars */}
        <div className="text-right shrink-0">
          <p className="text-lg font-bold tabular-nums tracking-tight text-foreground">
            ${product.price.toFixed(2)}
          </p>
          <div className="flex items-center gap-1 justify-end mt-0.5">
            <Stars rating={product.rating} size="sm" />
            <span className="text-xs text-muted-foreground tabular-nums">
              {product.rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Vertical rule */}
        <div className="w-px h-12 bg-border/40 shrink-0" />

        {/* Stock */}
        <div className="text-center shrink-0 min-w-14">
          <p className="text-xs text-muted-foreground mb-0.5">Stock</p>
          <p
            className="text-sm font-semibold tabular-nums"
            style={{ color: stockColor(product.stock) }}
          >
            {product.stock}
          </p>
        </div>

        {/* Popularity */}
        <div className="text-center shrink-0 min-w-16">
          <p className="text-xs text-muted-foreground mb-0.5">Pop.</p>
          <p className="text-sm font-semibold tabular-nums">
            {product.popularity.toLocaleString()}
          </p>
        </div>

        {/* Trend */}
        <div className="text-center shrink-0">
          <p className="text-xs text-muted-foreground mb-1">Trend</p>
          <Badge
            variant={trendVariant(product.trendScore)}
            className="text-xs tabular-nums font-bold h-5"
          >
            {product.trendScore}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export const ProductCard = memo(function ProductCard({
  product,
  viewMode = "list",
  onClick,
}: ProductCardProps) {
  const handleClick = onClick ? () => onClick(product) : undefined;
  return viewMode === "grid"
    ? <GridCard product={product} onClick={handleClick} />
    : <ListCard product={product} onClick={handleClick} />;
});
