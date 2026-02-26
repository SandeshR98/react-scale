import { useState } from "react";
import { Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CATEGORY_COLOR,
  CATEGORY_ICON,
  productImgUrl,
  stockColor,
  trendVariant,
} from "@/lib/product-utils";
import { Stars } from "./Stars";
import type { Product } from "../types/product";

function stockLabel(stock: number): string {
  if (stock <= 50) return "Low stock";
  return "In stock";
}

function StatBlock({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p className="text-base font-bold tabular-nums" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}

type ProductModalProps = {
  product: Product | null;
  onClose: () => void;
};

export function ProductModal({ product, onClose }: ProductModalProps) {
  const accentColor = product ? (CATEGORY_COLOR[product.category] ?? "#6b7280") : "#6b7280";
  const Icon = product ? (CATEGORY_ICON[product.category] ?? Package) : Package;

  // Derive imgLoaded from which product id has loaded — no useEffect needed.
  const [loadedProductId, setLoadedProductId] = useState<number | null>(null);
  const imgLoaded = loadedProductId === product?.id;

  return (
    <Dialog open={!!product} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden gap-0"
        style={{ borderTop: `4px solid ${accentColor}` }}
      >
        {product && (
          <div className="flex flex-row min-h-0">
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
              <Icon className="h-20 w-20" style={{ color: "#fff", opacity: 0.35 }} />

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
                onLoad={() => setLoadedProductId(product.id)}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />

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

            <div className="flex flex-col flex-1 min-w-0 p-6 gap-4 overflow-y-auto max-h-[82vh]">
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

                {/* Required by Radix for accessibility */}
                <DialogTitle className="text-xl font-bold leading-snug text-foreground">
                  {product.name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Product details for {product.name}
                </DialogDescription>
              </div>

              <p className="text-4xl font-extrabold tabular-nums tracking-tight text-foreground">
                ${product.price.toFixed(2)}
              </p>

              <div className="flex items-center gap-2">
                <Stars rating={product.rating} fontSize="1.15rem" gap={2} />
                <span className="text-sm text-muted-foreground tabular-nums font-medium">
                  {product.rating.toFixed(1)} / 5.0
                </span>
              </div>

              <Separator />

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
