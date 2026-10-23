import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteCategory, saveCategory } from "@/lib/admin/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  ActionForm,
  Checkbox,
  InlineAction,
  Panel,
  PanelTitle,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/admin/AdminForms";

/**
 * /admin/categories — the collections the catalogue is organised by.
 *
 * A collection with products cannot be deleted: the operator is told how many
 * products are in the way instead of silently losing them to a cascade.
 */

type CategoryRow = {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  description_en: string | null;
  description_hi: string | null;
  sort_order: number;
  is_active: boolean;
};

async function CategoriesScreen() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const [{ data: categories }, { data: productRefs }] = await Promise.all([
    supabase!
      .from("categories")
      .select("id, slug, name_en, name_hi, description_en, description_hi, sort_order, is_active")
      .order("sort_order", { ascending: true }),
    supabase!.from("products").select("category_id").limit(2000),
  ]);

  const rows = (categories ?? []) as CategoryRow[];
  const counts = new Map<string, number>();
  for (const ref of productRefs ?? []) {
    counts.set(ref.category_id, (counts.get(ref.category_id) ?? 0) + 1);
  }

  return (
    <>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Collections</h1>
        <p className="mt-1 text-sm text-charcoal/70">
          These drive /collections, the header menu and the product form&apos;s collection list.
        </p>
      </div>

      <Panel>
        <PanelTitle hint="Both names are required: the site is bilingual and falls back to neither.">
          Add a collection
        </PanelTitle>
        <ActionForm action={saveCategory} submit="Add collection">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="slug" label="Slug" required hint="Lowercase words joined by dashes." />
            <TextInput
              name="sort_order"
              label="Sort order"
              type="number"
              min="0"
              defaultValue={(rows.length + 1) * 10}
            />
            <TextInput name="name_en" label="Name (English)" required />
            <TextInput name="name_hi" label="Name (हिंदी)" required />
            <TextArea name="description_en" label="Description (English)" rows={2} />
            <TextArea name="description_hi" label="Description (हिंदी)" rows={2} />
          </div>
          <div className="mt-3">
            <Checkbox name="is_active" label="Show this collection on the site" defaultChecked />
          </div>
        </ActionForm>
      </Panel>

      <Panel>
        <PanelTitle>Existing collections</PanelTitle>
        {rows.length === 0 ? (
          <p className="text-sm text-charcoal/70">No collections yet.</p>
        ) : (
          <ul className="divide-y divide-gold/20">
            {rows.map((row) => (
              <li key={row.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {row.name_en} <span className="text-charcoal/70">/ {row.name_hi}</span>
                    </p>
                    <p className="text-xs text-charcoal/70">
                      /collections/{row.slug} · sort {row.sort_order} · {counts.get(row.id) ?? 0}{" "}
                      product{(counts.get(row.id) ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={row.is_active ? "ok" : "muted"}>
                      {row.is_active ? "visible" : "hidden"}
                    </StatusPill>
                    <InlineAction
                      action={deleteCategory}
                      label="Delete"
                      hidden={{ id: row.id }}
                      variant="danger"
                      confirm={`Delete the collection “${row.name_en}”?`}
                    />
                  </div>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-maroon hover:underline">Edit</summary>
                  <div className="mt-3">
                    <ActionForm action={saveCategory} submit="Save changes">
                      <input type="hidden" name="id" value={row.id} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextInput name="slug" label="Slug" required defaultValue={row.slug} />
                        <TextInput
                          name="sort_order"
                          label="Sort order"
                          type="number"
                          min="0"
                          defaultValue={row.sort_order}
                        />
                        <TextInput name="name_en" label="Name (English)" required defaultValue={row.name_en} />
                        <TextInput name="name_hi" label="Name (हिंदी)" required defaultValue={row.name_hi} />
                        <TextArea
                          name="description_en"
                          label="Description (English)"
                          rows={2}
                          defaultValue={row.description_en}
                        />
                        <TextArea
                          name="description_hi"
                          label="Description (हिंदी)"
                          rows={2}
                          defaultValue={row.description_hi}
                        />
                      </div>
                      <div className="mt-3">
                        <Checkbox
                          name="is_active"
                          label="Show this collection on the site"
                          defaultChecked={row.is_active}
                        />
                      </div>
                    </ActionForm>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-charcoal/70">Loading collections…</p>}>
      <CategoriesScreen />
    </Suspense>
  );
}
