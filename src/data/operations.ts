import type { Product } from "../types/product";

export function filterProducts(
  products: Product[],
  query: string,
  category: string
): Product[] {
  // Split query into whitespace-separated tokens so e.g. "ele 99" matches
  // products that contain BOTH "ele" (Electronics) AND "99" ($99.xx price).
  const tokens = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return products.filter((p) => {
    if (category !== "" && p.category !== category) return false;
    if (tokens.length === 0) return true;

    // Single lowercased haystack covering every visible field.
    // Built once per product per call; runs off the main thread via the worker.
    const haystack = (
      `${p.name} ${p.category} ${p.id} ` +
      `${p.price.toFixed(2)} ${p.rating.toFixed(1)} ` +
      `${p.stock} ${p.popularity} ${p.trendScore}`
    ).toLowerCase();

    // All tokens must match (AND semantics)
    return tokens.every((token) => haystack.includes(token));
  });
}

export function sortProducts(
  products: Product[],
  field: keyof Product,
  direction: "asc" | "desc"
): Product[] {
  const sorted = [...products].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
}
