import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteFaq, saveFaq } from "@/lib/admin/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  ActionForm,
  Checkbox,
  InlineAction,
  Panel,
  PanelTitle,
  Select,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/admin/AdminForms";

/**
 * /admin/faqs — questions and answers shown on /faq.
 *
 * When this table is empty, /faq falls back to the reviewed answers baked into
 * `src/lib/content/faq.ts`. As soon as a row is active here, the database becomes
 * the source for the whole page — which is why the notice below explains the
 * switch rather than leaving the operator guessing.
 */

type FaqRow = {
  id: string;
  question_en: string;
  question_hi: string;
  answer_en: string;
  answer_hi: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
};

const GROUPS = [
  { value: "store", label: "Store & visiting" },
  { value: "products", label: "Products" },
  { value: "delivery", label: "Delivery & service" },
  { value: "rates", label: "Rates & pricing" },
  { value: "scheme", label: "Gold saving scheme" },
];

async function FaqsScreen() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase!
    .from("faqs")
    .select("id, question_en, question_hi, answer_en, answer_hi, category, sort_order, is_active")
    .order("sort_order", { ascending: true });

  const rows = (data ?? []) as FaqRow[];
  const activeRows = rows.filter((row) => row.is_active);

  return (
    <>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">FAQs</h1>
        <p className="mt-1 text-sm text-charcoal/70">
          Answers published on <Link href="/faq" className="text-maroon underline">/faq</Link>. Keep
          them plain and true — a promise made here is a promise the showroom has to keep.
        </p>
      </div>

      <Panel>
        <PanelTitle>Which answers the site is using</PanelTitle>
        {activeRows.length === 0 ? (
          <p className="text-sm text-charcoal/70">
            No FAQ is active, so <code>/faq</code> is showing the built-in answers written for the
            site (they cover the delivery limit, rates and the scheme). Add and activate rows here
            to take over the whole page.
          </p>
        ) : (
          <p className="text-sm text-charcoal/70">
            {activeRows.length} answer{activeRows.length === 1 ? "" : "s"} from this table are live
            on <code>/faq</code>, replacing the built-in set. The FAQ structured data Google reads is
            generated from exactly these rows.
          </p>
        )}
      </Panel>

      <Panel>
        <PanelTitle hint="Answer the question the customer actually asks, in one or two sentences.">
          Add a question
        </PanelTitle>
        <ActionForm action={saveFaq} submit="Add question">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput name="question_en" label="Question (English)" required />
              <TextInput name="question_hi" label="Question (हिंदी)" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextArea name="answer_en" label="Answer (English)" rows={3} required />
              <TextArea name="answer_hi" label="Answer (हिंदी)" rows={3} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select name="category" label="Section" options={GROUPS} defaultValue="store" />
              <TextInput name="sort_order" label="Sort order" type="number" min="0" defaultValue={rows.length * 10} />
            </div>
          </div>
          <div className="mt-3">
            <Checkbox name="is_active" label="Active — publish this answer" defaultChecked />
          </div>
        </ActionForm>
      </Panel>

      <Panel>
        <PanelTitle>All questions ({rows.length})</PanelTitle>
        {rows.length === 0 ? (
          <p className="text-sm text-charcoal/70">Nothing stored yet.</p>
        ) : (
          <ul className="divide-y divide-gold/20">
            {rows.map((row) => (
              <li key={row.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{row.question_en}</p>
                    <p className="text-sm text-charcoal/70">{row.question_hi}</p>
                    <p className="mt-1 text-xs text-charcoal/70">
                      {row.category ?? "store"} · sort {row.sort_order}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={row.is_active ? "ok" : "muted"}>
                      {row.is_active ? "published" : "hidden"}
                    </StatusPill>
                    <InlineAction
                      action={deleteFaq}
                      label="Delete"
                      hidden={{ id: row.id }}
                      variant="danger"
                      confirm="Delete this question?"
                    />
                  </div>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-maroon hover:underline">Edit</summary>
                  <div className="mt-3">
                    <ActionForm action={saveFaq} submit="Save changes">
                      <input type="hidden" name="id" value={row.id} />
                      <div className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextInput
                            name="question_en"
                            label="Question (English)"
                            required
                            defaultValue={row.question_en}
                          />
                          <TextInput
                            name="question_hi"
                            label="Question (हिंदी)"
                            required
                            defaultValue={row.question_hi}
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextArea
                            name="answer_en"
                            label="Answer (English)"
                            rows={3}
                            required
                            defaultValue={row.answer_en}
                          />
                          <TextArea
                            name="answer_hi"
                            label="Answer (हिंदी)"
                            rows={3}
                            required
                            defaultValue={row.answer_hi}
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Select
                            name="category"
                            label="Section"
                            options={GROUPS}
                            defaultValue={row.category ?? "store"}
                          />
                          <TextInput
                            name="sort_order"
                            label="Sort order"
                            type="number"
                            min="0"
                            defaultValue={row.sort_order}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Checkbox name="is_active" label="Active — publish this answer" defaultChecked={row.is_active} />
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

export default function AdminFaqsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-charcoal/70">Loading FAQs…</p>}>
      <FaqsScreen />
    </Suspense>
  );
}
