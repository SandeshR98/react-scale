import type { Product } from "../types/product";

function tokenize(query: string): string[] {
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

function buildHaystack(p: Product): string {
  return (
    `${p.name} ${p.category} ${p.id} ` +
    `${p.price.toFixed(2)} ${p.rating.toFixed(1)} ` +
    `${p.stock} ${p.popularity} ${p.trendScore}`
  ).toLowerCase();
}

export function filterProducts(
  products: Product[],
  query: string,
  category: string
): Product[] {
  // Split query into whitespace-separated tokens so e.g. "ele 99" matches
  // products that contain BOTH "ele" (Electronics) AND "99" ($99.xx price).
  const tokens = tokenize(query);

  return products.filter((p) => {
    if (category !== "" && p.category !== category) return false;
    if (tokens.length === 0) return true;

    // Single lowercased haystack covering every visible field.
    // Built once per product per call; runs off the main thread via the worker.
    const haystack = buildHaystack(p);

    // All tokens must match (AND semantics)
    return tokens.every((token) => haystack.includes(token));
  });
}

// Returns a Uint32Array of matching indices — intended for the Web Worker path.
// The caller transfers the buffer (postMessage transferable) so there is zero
// structured-clone cost on the main thread when deserializing the response.
export function filterProductIndices(
  products: Product[],
  query: string,
  category: string
): Uint32Array {
  const tokens = tokenize(query);
  const indices: number[] = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (category !== "" && p.category !== category) continue;
    if (tokens.length === 0) { indices.push(i); continue; }
    const haystack = buildHaystack(p);
    if (tokens.every((t) => haystack.includes(t))) indices.push(i);
  }

  return new Uint32Array(indices);
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
