import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteProduct, saveProduct } from "@/lib/admin/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/admin/schema";
import {
  ActionForm,
  Checkbox,
  InlineAction,
  Panel,
  PanelTitle,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/AdminForms";
import ImageField from "@/components/admin/ImageField";

/**
 * /admin/products/[ref] — create or edit one product.
 *
 * `ref` is the product's human code (what the showroom uses on the floor) or its
 * UUID; "new" opens a blank form. Both are accepted so a link from the list and a
 * link from elsewhere in the tool always work.
 *
 * Image handling: `ImageField` uploads to the `product-images` bucket using the
 * signed-in admin's session (storage RLS authorises it) and stores one line per
 * image — `url | alt EN | alt HI`. Alt text is required by the form's own hint
 * because an image with no description is invisible to a blind visitor.
 */

type CategoryOption = { id: string; name_en: string };
type ProductRecord = {
  id: string;
  code: string;
  slug: string;
  category_id: string;
  name_en: string;
  name_hi: string;
  description_en: string | null;
  description_hi: string | null;
  metal: string | null;
  purity: string | null;
  gemstone: string | null;
  weight_grams: number | string | null;
  price_inr: number | string | null;
  is_price_on_request: boolean;
  availability: string;
  status: string;
  is_featured: boolean;
  sort_order: number;
  jewelry_type: string | null;
  gender: string | null;
  occasion: string | null;
  stone_detail: string | null;
  product_images: { url: string; alt_en: string | null; alt_hi: string | null; position: number | null }[] | null;
};

function toNumberString(value: number | string | null): string | undefined {
  if (value === null || value === undefined) return undefined;
  return typeof value === "number" ? String(value) : String(value);
}

/**
 * `params` is a Promise here and is awaited *inside* the Suspense boundary: with
 * Cache Components enabled, reading a dynamic API in the static shell is an error,
 * so the promise is handed down and resolved where streaming is allowed.
 */
function EditorScreen({ params }: { params: Promise<{ ref: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-charcoal/70">Loading the editor…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<{ ref: string }> }) {
  const { ref: productKey } = await params;
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const { data: categories } = await supabase!
    .from("categories")
    .select("id, name_en")
    .order("sort_order", { ascending: true });

  const options = (categories ?? []) as CategoryOption[];
  const isNew = productKey === "new";

  let product: ProductRecord | null = null;
  if (!isNew) {
    const query = supabase!
      .from("products")
      .select(
        "id, code, slug, category_id, name_en, name_hi, description_en, description_hi, metal, purity, gemstone, weight_grams, price_inr, is_price_on_request, availability, status, is_featured, sort_order, jewelry_type, gender, occasion, stone_detail, product_images ( url, alt_en, alt_hi, position )",
      );
    const { data } = UUID_RE.test(productKey)
      ? await query.eq("id", productKey).maybeSingle()
      : await query.eq("code", productKey).maybeSingle();
    product = (data as unknown as ProductRecord) ?? null;
    if (!product) notFound();
  }

  const images = [...(product?.product_images ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((image) => [image.url, image.alt_en ?? "", image.alt_hi ?? ""].join(" | "))
    .join("\n");

  if (options.length === 0) {
    return (
      <Panel>
        <PanelTitle>Add a collection first</PanelTitle>
        <p className="text-sm text-charcoal/70">
          Every product belongs to a collection, and none exists yet. Create one under{" "}
          <Link href="/admin/categories" className="text-maroon underline">
            Collections
          </Link>{" "}
          and come back.
        </p>
      </Panel>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl">
            {isNew ? "New product" : product!.name_en}
          </h1>
          <p className="mt-1 text-sm text-charcoal/70">
            {isNew
              ? "Saved as a draft until you publish it, so nothing half-finished reaches a visitor."
              : `Code ${product!.code} · /products/${product!.slug}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && product!.status === "active" ? (
            <Link
              href={`/products/${product!.slug}`}
              target="_blank"
              className="text-sm text-charcoal/70 hover:text-maroon hover:underline"
            >
              View on the site
            </Link>
          ) : null}
          <Link href="/admin/products" className="text-sm text-charcoal/70 hover:underline">
            ← All products
          </Link>
        </div>
      </div>

      <ActionForm action={saveProduct} submit="Save product">
        {product ? <input type="hidden" name="id" value={product.id} /> : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <PanelTitle hint="The Hindi name is shown to visitors using the हिंदी toggle, so both are required.">
              Identity
            </PanelTitle>
            <div className="grid gap-4">
              <TextInput
                name="code"
                label="Product code"
                required
                defaultValue={product?.code}
                hint="Internal reference, e.g. TJ-GC-001. Must be unique."
              />
              <TextInput
                name="slug"
                label="URL slug"
                required
                defaultValue={product?.slug}
                hint="lowercase-words-with-dashes — becomes /products/…"
              />
              <TextInput name="name_en" label="Name (English)" required defaultValue={product?.name_en} />
              <TextInput name="name_hi" label="Name (हिंदी)" required defaultValue={product?.name_hi} />
              <Select
                name="category_id"
                label="Collection"
                required
                defaultValue={product?.category_id ?? options[0]?.id}
                options={options.map((option) => ({ value: option.id, label: option.name_en }))}
              />
              <TextArea
                name="description_en"
                label="Description (English)"
                rows={4}
                defaultValue={product?.description_en}
                hint="Describe what the piece actually is. Do not state a certification, purity or weight the showroom has not verified."
              />
              <TextArea
                name="description_hi"
                label="Description (हिंदी)"
                rows={4}
                defaultValue={product?.description_hi}
              />
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel>
              <PanelTitle hint="Used by the catalogue filters and the /jewellery landing pages.">
                Classification
              </PanelTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  name="jewelry_type"
                  label="Type"
                  defaultValue={product?.jewelry_type ?? "necklaces"}
                  options={[
                    "rings",
                    "necklaces",
                    "earrings",
                    "bangles",
                    "bracelets",
                    "chains",
                    "pendants",
                    "mangalsutra",
                    "necklace-sets",
                    "anklets",
                    "coins-bars",
                    "idols",
                    "gemstones",
                  ].map((value) => ({ value, label: value.replace(/-/g, " ") }))}
                />
                <Select
                  name="metal"
                  label="Metal"
                  defaultValue={product?.metal ?? "gold"}
                  options={[
                    { value: "gold", label: "Gold" },
                    { value: "silver", label: "Silver" },
                    { value: "fashion", label: "Fancy / artificial" },
                    { value: "gemstone", label: "Gemstone" },
                  ]}
                />
                <Select
                  name="gender"
                  label="Styled for"
                  defaultValue={product?.gender ?? "unisex"}
                  options={[
                    { value: "women", label: "Women" },
                    { value: "men", label: "Men" },
                    { value: "kids", label: "Kids" },
                    { value: "unisex", label: "Unisex" },
                  ]}
                />
                <Select
                  name="occasion"
                  label="Occasion"
                  defaultValue={product?.occasion ?? "daily"}
                  options={[
                    { value: "bridal", label: "Bridal" },
                    { value: "daily", label: "Daily wear" },
                    { value: "festive", label: "Festive" },
                    { value: "gifting", label: "Gifting" },
                  ]}
                />
                <Select
                  name="purity"
                  label="Purity (only if verified)"
                  defaultValue={product?.purity ?? ""}
                  options={[
                    { value: "", label: "Not stated" },
                    { value: "24K", label: "24K" },
                    { value: "22K", label: "22K" },
                    { value: "20K", label: "20K" },
                    { value: "18K", label: "18K" },
                    { value: "14K", label: "14K" },
                    { value: "925", label: "925 (silver)" },
                    { value: "other", label: "Other" },
                  ]}
                />
                <TextInput name="gemstone" label="Gemstone" defaultValue={product?.gemstone} />
                <TextInput
                  name="stone_detail"
                  label="Stone detail"
                  defaultValue={product?.stone_detail}
                  hint="Printed exactly as you type it. Never describe a stone from a photo."
                  className="sm:col-span-2"
                />
              </div>
            </Panel>

            <Panel>
              <PanelTitle hint="A price is only shown when you have confirmed it. “Price on request” hides the price completely.">
                Pricing &amp; availability
              </PanelTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  name="price_inr"
                  label="Price (₹)"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product?.is_price_on_request ? undefined : toNumberString(product?.price_inr ?? null)}
                />
                <TextInput
                  name="weight_grams"
                  label="Weight (grams)"
                  type="number"
                  step="0.001"
                  min="0"
                  defaultValue={toNumberString(product?.weight_grams ?? null)}
                />
                <Select
                  name="availability"
                  label="Availability"
                  defaultValue={product?.availability ?? "on_enquiry"}
                  options={[
                    { value: "on_enquiry", label: "Ask at the showroom" },
                    { value: "in_stock", label: "In stock" },
                    { value: "sold_out", label: "Sold out" },
                  ]}
                />
                <TextInput
                  name="sort_order"
                  label="Sort order"
                  type="number"
                  min="0"
                  defaultValue={product?.sort_order ?? 0}
                  hint="Lower numbers appear first."
                />
              </div>
              <div className="mt-4 space-y-3">
                <Checkbox
                  name="is_price_on_request"
                  label="Price on request"
                  defaultChecked={product?.is_price_on_request ?? true}
                  hint="Shows “Price on Enquiry” instead of a number."
                />
                <Checkbox
                  name="is_featured"
                  label="Featured on the home page"
                  defaultChecked={product?.is_featured ?? false}
                />
              </div>
            </Panel>

            <Panel>
              <PanelTitle hint="Saved as a draft, the product exists here but no visitor can see it.">
                Visibility
              </PanelTitle>
              <Select
                name="status"
                label="Status"
                defaultValue={product?.status ?? "draft"}
                options={[
                  { value: "draft", label: "Draft — not on the site" },
                  { value: "active", label: "Active — live on the site" },
                  { value: "archived", label: "Archived — hidden, kept for records" },
                ]}
              />
            </Panel>
          </div>
        </div>

        <Panel className="mt-6">
          <PanelTitle hint="Uploads go straight to Supabase Storage using your own signed-in session. Nothing is sent anywhere else.">
            Photographs
          </PanelTitle>
          <ImageField defaultValue={images} />
        </Panel>
      </ActionForm>

      {!isNew ? (
        <Panel className="border-maroon/30">
          <PanelTitle hint="Deleting a product removes it from the catalogue, the home page and any wish list that referenced it. Archiving is usually what you want instead.">
            Danger zone
          </PanelTitle>
          <InlineAction
            action={deleteProduct}
            label="Delete this product permanently"
            hidden={{ id: product!.id }}
            variant="danger"
            confirm={`Delete “${product!.name_en}” and its photos? This cannot be undone.`}
          />
        </Panel>
      ) : null}
    </>
  );
}

export default function AdminProductEditorPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  return <EditorScreen params={params} />;
}
