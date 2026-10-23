import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteProduct, setProductStatus } from "@/lib/admin/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { InlineAction, Panel, PanelTitle, StatusPill } from "@/components/admin/AdminForms";

/**
 * /admin/products — every product, whatever its status.
 *
 * The list is the source of truth for the operator: drafts are visible here (with
 * a clear "not on the site" marker) but are invisible to visitors, which is how a
 * half-written product can be prepared without it going live.
 */

type ProductRow = {
  id: string;
  code: string;
  slug: string;
  name_en: string;
  status: "draft" | "active" | "archived";
  availability: "on_enquiry" | "in_stock" | "sold_out";
  is_featured: boolean;
  price_inr: number | string | null;
  is_price_on_request: boolean;
  metal: string | null;
  categories: { name_en: string } | { name_en: string }[] | null;
};

function priceLabel(row: ProductRow): string {
  if (row.is_price_on_request || row.price_inr === null) return "On request";
  const value = typeof row.price_inr === "number" ? row.price_inr : Number(row.price_inr);
  return Number.isFinite(value) ? `₹ ${value.toLocaleString("en-IN")}` : "On request";
}

async function ProductsScreen() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase!
    .from("products")
    .select(
      "id, code, slug, name_en, status, availability, is_featured, price_inr, is_price_on_request, metal, categories ( name_en )",
    )
    .order("sort_order", { ascending: true })
    .limit(300);

  const rows = (data ?? []) as unknown as ProductRow[];
  const active = rows.filter((row) => row.status === "active").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl">Products</h1>
          <p className="mt-1 text-sm text-charcoal/70">
            {rows.length} record{rows.length === 1 ? "" : "s"} · {active} live on the site
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-sm bg-maroon px-4 py-2 text-sm text-offwhite hover:bg-maroon-700"
        >
          Add a product
        </Link>
      </div>

      <Panel>
        <PanelTitle hint="A draft or archived product is never shown to a visitor, even if it has photos and a price.">
          All products
        </PanelTitle>

        {rows.length === 0 ? (
          <p className="text-sm text-charcoal/70">
            No products yet. The public catalogue shows its empty state — visit the showroom
            or message on WhatsApp — until the first real product is published.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gold/40 text-left text-xs uppercase tracking-wide text-charcoal/70">
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Collection</th>
                  <th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Featured</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
                  return (
                    <tr key={row.id} className="border-b border-gold/20 align-top last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{row.code}</td>
                      <td className="py-2 pr-3">
                        <Link
                          href={`/admin/products/${row.code}`}
                          className="text-charcoal hover:text-maroon hover:underline"
                        >
                          {row.name_en}
                        </Link>
                        <span className="block text-xs text-charcoal/70">/{row.slug}</span>
                      </td>
                      <td className="py-2 pr-3 text-charcoal/70">{category?.name_en ?? "—"}</td>
                      <td className="py-2 pr-3 tabular-nums">{priceLabel(row)}</td>
                      <td className="py-2 pr-3">
                        <StatusPill
                          tone={row.status === "active" ? "ok" : row.status === "draft" ? "warn" : "muted"}
                        >
                          {row.status}
                        </StatusPill>
                        <span className="mt-1 block text-xs text-charcoal/70">
                          {row.availability.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-charcoal/70">{row.is_featured ? "Yes" : "—"}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <InlineAction
                            action={setProductStatus}
                            label={row.status === "active" ? "Unpublish" : "Publish"}
                            hidden={{ id: row.id, status: row.status === "active" ? "draft" : "active" }}
                            variant="primary"
                          />
                          <InlineAction
                            action={setProductStatus}
                            label={row.status === "archived" ? "Restore draft" : "Archive"}
                            hidden={{
                              id: row.id,
                              status: row.status === "archived" ? "draft" : "archived",
                            }}
                          />
                          {row.status === "active" ? (
                            <Link
                              href={`/products/${row.slug}`}
                              className="text-xs text-charcoal/70 hover:text-maroon hover:underline"
                              target="_blank"
                            >
                              View
                            </Link>
                          ) : (
                            <span className="text-xs text-charcoal/70">Not on site</span>
                          )}
                          <InlineAction
                            action={deleteProduct}
                            label="Delete"
                            hidden={{ id: row.id }}
                            variant="danger"
                            confirm={`Delete “${row.name_en}” permanently? Its photos go too.`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-charcoal/70">Loading products…</p>}>
      <ProductsScreen />
    </Suspense>
  );
}
