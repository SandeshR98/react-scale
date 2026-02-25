import { useEffect, useState } from "react";
import { Zap, Shirt, Home, Dumbbell, BookOpen, Gamepad2, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Product } from "../types/product";

// ─── Shared helpers (self-contained — no dependency on ProductCard) ───────────

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

function productImgUrl(id: number, w: number, h: number): string {
  return `https://picsum.photos/seed/${(id - 1) % 50}/${w}/${h}`;
}

function stockColor(stock: number): string {
  if (stock <= 50)  return "#ef4444";
  if (stock <= 200) return "#f59e0b";
  return "#22c55e";
}

function stockLabel(stock: number): string {
  if (stock <= 50)  return "Low stock";
  if (stock <= 200) return "In stock";
  return "In stock";
}

function trendVariant(score: number): "default" | "secondary" | "outline" {
  if (score >= 70) return "default";
  if (score >= 30) return "secondary";
  return "outline";
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span style={{ display: "inline-flex", gap: 2, lineHeight: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < filled ? "#f59e0b" : "#d1d5db", fontSize: "1.15rem" }}>★</span>
      ))}
    </span>
  );
}

function StatBlock({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p className="text-base font-bold tabular-nums" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}

// ─── ProductModal ─────────────────────────────────────────────────────────────

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const accentColor = product ? (CATEGORY_COLOR[product.category] ?? "#6b7280") : "#6b7280";
  const Icon = product ? (CATEGORY_ICON[product.category] ?? Package) : Package;

  // Track whether the real photo has finished loading so we can fade it in.
  // Resets to false each time a different product is opened.
  const [imgLoaded, setImgLoaded] = useState(false);
  useEffect(() => { setImgLoaded(false); }, [product?.id]);

  return (
    <Dialog open={!!product} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden gap-0"
        style={{ borderTop: `4px solid ${accentColor}` }}
      >
        {product && (
          <div className="flex flex-row min-h-0">

            {/* ── Left: image column ── */}
            <div
              style={{
                width: 220,
                minWidth: 220,
                flexShrink: 0,
                position: "relative",
                background: `linear-gradient(160deg, ${accentColor}cc 0%, ${accentColor}44 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Fallback icon — also acts as the background while the image loads */}
              <Icon className="h-20 w-20" style={{ color: "#fff", opacity: 0.35 }} />

              {/* Shimmer pulse while the photo is in-flight */}
              {!imgLoaded && (
                <div
                  className="animate-pulse"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(160deg, ${accentColor}55 0%, ${accentColor}22 100%)`,
                  }}
                />
              )}

              {/*
               * Real photo — uses the same 400×300 URL as the grid cards so the
               * browser serves it from cache when the user clicks from grid view.
               * On list/table views it fetches quickly from the CDN then fades in.
               */}
              <img
                src={productImgUrl(product.id, 400, 300)}
                alt={product.name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  opacity: imgLoaded ? 1 : 0,
                  transition: "opacity 220ms ease",
                }}
                onLoad={() => setImgLoaded(true)}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />

              {/* Translucent ID pill at bottom */}
              <span
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(0,0,0,0.45)",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                #{String(product.id).padStart(5, "0")}
              </span>
            </div>

            {/* ── Right: details column ── */}
            <div className="flex flex-col flex-1 min-w-0 p-6 gap-4 overflow-y-auto max-h-[82vh]">

              {/* Category + name */}
              <div className="flex flex-col gap-2 pr-8">
                <Badge
                  variant="outline"
                  className="self-start text-xs font-semibold"
                  style={{
                    color: accentColor,
                    borderColor: `${accentColor}50`,
                    backgroundColor: `${accentColor}14`,
                  }}
                >
                  {product.category}
                </Badge>

                {/* DialogTitle required by Radix for accessibility */}
                <DialogTitle className="text-xl font-bold leading-snug text-foreground">
                  {product.name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Product details for {product.name}
                </DialogDescription>
              </div>

              {/* Price */}
              <p className="text-4xl font-extrabold tabular-nums tracking-tight text-foreground">
                ${product.price.toFixed(2)}
              </p>

              {/* Stars + numeric rating */}
              <div className="flex items-center gap-2">
                <Stars rating={product.rating} />
                <span className="text-sm text-muted-foreground tabular-nums font-medium">
                  {product.rating.toFixed(1)} / 5.0
                </span>
              </div>

              <Separator />

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <StatBlock
                  label="Stock"
                  value={
                    <span className="flex items-center gap-1.5">
                      <span style={{ color: stockColor(product.stock), fontSize: "0.5rem" }}>●</span>
                      {product.stock} — {stockLabel(product.stock)}
                    </span>
                  }
                  valueColor={stockColor(product.stock)}
                />

                <StatBlock
                  label="Popularity"
                  value={product.popularity.toLocaleString()}
                />

                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Trend</p>
                  <Badge
                    variant={trendVariant(product.trendScore)}
                    className="self-start text-sm font-bold tabular-nums px-3 py-0.5"
                  >
                    {product.trendScore}
                  </Badge>
                </div>

                <StatBlock
                  label="Product ID"
                  value={`#${String(product.id).padStart(5, "0")}`}
                />
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
