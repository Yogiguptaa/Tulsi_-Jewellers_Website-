import type { Product } from "@/lib/catalogue/types";
import ProductCard from "./ProductCard";

/**
 * Server-friendly grid. ProductCard is a client component (wishlist + language),
 * so this wrapper stays a plain server component and is reused by the collection,
 * type, gem and wishlist pages.
 */
export default function ProductGrid({
  products,
  columns = 4,
}: {
  products: Product[];
  columns?: 3 | 4;
}) {
  if (products.length === 0) return null;
  const cols =
    columns === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  return (
    <ul className={`grid gap-5 ${cols}`}>
      {products.map((product) => (
        <li key={product.code} className="h-full">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
