import type { Product } from "../types/product";

const ADJECTIVES = [
  "Premium", "Essential", "Advanced", "Classic", "Elite",
  "Ultra", "Smart", "Compact", "Deluxe", "Modern",
  "Professional", "Lightweight", "Durable", "Portable", "Versatile",
];

const NOUNS = [
  "Widget", "Module", "Device", "Kit", "Pack",
  "Set", "System", "Unit", "Tool", "Bundle",
  "Series", "Edition", "Collection", "Suite", "Package",
];

export const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports",
  "Books",
  "Toys",
];

export function generateProducts(count: number): Product[] {
  const products: Product[] = [];

  for (let i = 1; i <= count; i++) {
    const adjIndex = (i * 7) % ADJECTIVES.length;
    const nounIndex = (i * 13) % NOUNS.length;
    const categoryIndex = (i - 1) % CATEGORIES.length; // coprime with 6 → all categories get items

    const name = `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]} ${i}`;
    const category = CATEGORIES[categoryIndex];
    const price = Math.round(((i * 17) % 99899 + 100) / 100 * 100) / 100; // $1.00–$999.99
    const rating = Math.round(((i * 11) % 41 + 10) / 10 * 10) / 10; // 1.0–5.0
    const stock = (i * 19) % 501; // 0–500
    const popularity = (i * 23) % 10001; // 0–10000
    const trendScore = Math.round((rating / 5) * (popularity / 10000) * 100);

    products.push({ id: i, name, category, price, rating, stock, popularity, trendScore });
  }

  return products;
}
