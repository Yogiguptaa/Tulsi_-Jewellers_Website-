import { Suspense } from "react";
import { isOwner, requireAdmin } from "@/lib/admin/auth";
import { deletePricingRule, savePricingRule } from "@/lib/admin/actions";
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
 * /admin/pricing-rules — GST, making charges and similar numbers.
 *
 * Owner-only, by design: a rule marked `is_public` is shown on the public pages
 * that use it, so changing it changes what visitors are told about pricing. A
 * `staff` account sees the values but cannot edit them (the server action refuses
 * too, not just the UI).
 *
 * An inactive rule is ignored by the calculator rather than treated as zero — the
 * code never invents a percentage.
 */

type RuleRow = {
  id: string;
  rule_key: string;
  label_en: string;
  label_hi: string | null;
  value: number | string;
  unit: string;
  is_active: boolean;
  is_public: boolean;
  notes: string | null;
};

async function PricingRulesScreen() {
  const admin = await requireAdmin();
  const owner = isOwner(admin);
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase!
    .from("pricing_rules")
    .select("id, rule_key, label_en, label_hi, value, unit, is_active, is_public, notes")
    .order("rule_key", { ascending: true });

  const rows = (data ?? []) as RuleRow[];

  return (
    <>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Pricing rules</h1>
        <p className="mt-1 text-sm text-charcoal/70">
          Percentages and per-gram amounts used when estimating a value. A rule is only shown to
          visitors when you mark it public.
        </p>
      </div>

      {!owner ? (
        <Panel className="border-gold/60">
          <PanelTitle>Read-only</PanelTitle>
          <p className="text-sm text-charcoal/70">
            Your account has the <strong>staff</strong> role, so you can see these values but not
            change them. Pricing changes require the owner account.
          </p>
        </Panel>
      ) : (
        <Panel>
          <PanelTitle hint="Leave a rule inactive until you have confirmed the number with the showroom's own pricing.">
            Add a rule
          </PanelTitle>
          <ActionForm action={savePricingRule} submit="Add rule">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextInput
                name="rule_key"
                label="Key"
                required
                hint="Lowercase, e.g. gst, making_charge_percent."
              />
              <TextInput name="label_en" label="Label (English)" required />
              <TextInput name="label_hi" label="Label (हिंदी)" />
              <TextInput name="value" label="Value" type="number" step="0.0001" required />
              <TextInput
                name="unit"
                label="Unit"
                required
                placeholder="percent | INR_PER_GRAM"
                hint="Free text; shown next to the number."
              />
              <TextInput name="notes" label="Note" hint="Internal only." />
            </div>
            <div className="mt-3 flex flex-wrap gap-6">
              <Checkbox name="is_active" label="Active — used by the calculator" defaultChecked />
              <Checkbox name="is_public" label="Show this rule to visitors" />
            </div>
          </ActionForm>
        </Panel>
      )}

      <Panel>
        <PanelTitle>All rules ({rows.length})</PanelTitle>
        {rows.length === 0 ? (
          <p className="text-sm text-charcoal/70">
            No rules yet. The rates calculator therefore shows metal value only, and says so.
          </p>
        ) : (
          <ul className="divide-y divide-gold/20">
            {rows.map((row) => (
              <li key={row.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {row.label_en}{" "}
                      <span className="tabular-nums text-charcoal/70">
                        {Number(row.value)} {row.unit}
                      </span>
                    </p>
                    <p className="text-xs text-charcoal/70">
                      <code>{row.rule_key}</code>
                      {row.label_hi ? ` · ${row.label_hi}` : ""}
                    </p>
                    {row.notes ? (
                      <p className="mt-1 text-xs text-charcoal/70">{row.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={row.is_active ? "ok" : "muted"}>
                      {row.is_active ? "active" : "inactive"}
                    </StatusPill>
                    <StatusPill tone={row.is_public ? "info" : "muted"}>
                      {row.is_public ? "public" : "internal"}
                    </StatusPill>
                  </div>
                </div>

                {owner ? (
                  <>
                    <div className="mt-2">
                      <InlineAction
                        action={deletePricingRule}
                        label="Delete"
                        hidden={{ id: row.id }}
                        variant="danger"
                        confirm={`Delete the rule “${row.label_en}”?`}
                      />
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-maroon hover:underline">
                        Edit
                      </summary>
                      <div className="mt-3">
                        <ActionForm action={savePricingRule} submit="Save changes">
                          <input type="hidden" name="id" value={row.id} />
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <TextInput
                              name="rule_key"
                              label="Key"
                              required
                              defaultValue={row.rule_key}
                            />
                            <TextInput
                              name="label_en"
                              label="Label (English)"
                              required
                              defaultValue={row.label_en}
                            />
                            <TextInput
                              name="label_hi"
                              label="Label (हिंदी)"
                              defaultValue={row.label_hi}
                            />
                            <TextInput
                              name="value"
                              label="Value"
                              type="number"
                              step="0.0001"
                              required
                              defaultValue={String(Number(row.value))}
                            />
                            <TextInput
                              name="unit"
                              label="Unit"
                              required
                              defaultValue={row.unit}
                            />
                          </div>
                          <div className="mt-3">
                            <TextArea name="notes" label="Note (internal)" rows={2} defaultValue={row.notes} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-6">
                            <Checkbox
                              name="is_active"
                              label="Active — used by the calculator"
                              defaultChecked={row.is_active}
                            />
                            <Checkbox
                              name="is_public"
                              label="Show this rule to visitors"
                              defaultChecked={row.is_public}
                            />
                          </div>
                        </ActionForm>
                      </div>
                    </details>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

export default function AdminPricingRulesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-charcoal/70">Loading pricing rules…</p>}>
      <PricingRulesScreen />
    </Suspense>
  );
}
