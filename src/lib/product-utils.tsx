import type { ComponentType, CSSProperties } from "react";
import { Zap, Shirt, Home, Dumbbell, BookOpen, Gamepad2 } from "lucide-react";

export const CATEGORY_COLOR: Record<string, string> = {
  "Electronics":   "#3b82f6",
  "Clothing":      "#a855f7",
  "Home & Garden": "#22c55e",
  "Sports":        "#f97316",
  "Books":         "#f59e0b",
  "Toys":          "#ec4899",
};

export const CATEGORY_ICON: Record<
  string,
  ComponentType<{ className?: string; style?: CSSProperties }>
> = {
  "Electronics":   Zap,
  "Clothing":      Shirt,
  "Home & Garden": Home,
  "Sports":        Dumbbell,
  "Books":         BookOpen,
  "Toys":          Gamepad2,
};

// 50 Picsum seeds cycle across 100K products; browser caches all after first scroll.
export function productImgUrl(id: number, w = 80, h = 80): string {
  return `https://picsum.photos/seed/${(id - 1) % 50}/${w}/${h}`;
}

export function stockColor(stock: number): string {
  if (stock <= 50)  return "#ef4444";
  if (stock <= 200) return "#f59e0b";
  return "#22c55e";
}

export function trendVariant(score: number): "default" | "secondary" | "outline" {
  if (score >= 70) return "default";
  if (score >= 30) return "secondary";
  return "outline";
}
