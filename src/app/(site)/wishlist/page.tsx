import type { Metadata } from "next";
import { getCatalogue } from "@/lib/catalogue/source";
import { buildMetadata } from "@/lib/seo";
import { WishlistPageView } from "@/components/views/wishlist-views";

/**
 * The wishlist is stored in the visitor's browser only, so this page is never
 * indexed and the saved items are resolved on the client from the catalogue
 * passed down here.
 */
export const metadata: Metadata = buildMetadata({
  title: "Wishlist | Tulsi Jewellers",
  description:
    "Items you have saved in this browser at Tulsi Jewellers. Saved items stay on this device and need no account.",
  path: "/wishlist",
  noIndex: true,
});

export default async function WishlistPage() {
  const { products } = await getCatalogue();

  return <WishlistPageView products={products} />;
}
