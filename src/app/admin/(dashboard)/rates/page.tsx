import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import {
  approveRate,
  deleteRate,
  rateHealth,
  rejectRate,
  runRateJobNow,
  saveManualRates,
} from "@/lib/admin/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { RATE_ROWS, RATE_DISCLAIMER } from "@/lib/config";
import {
  ActionForm,
  Checkbox,
  InlineAction,
  Panel,
  PanelTitle,
  Select,
  StatusPill,
  TextInput,
} from "@/components/admin/AdminForms";

/**
 * /admin/rates — record today's benchmark and see exactly what is published.
 *
 * The form deliberately mirrors IBJA's own shape: one date, one session (AM/PM),
 * one GST statement, then a value per fineness. A value that fails the shared
 * validator is refused with a reason, so a mistyped zero can never reach the site.
 */

type RateRow = {
  id: string;
  metal: "gold" | "silver";
  purity: string;
  unit: "INR_PER_10_GRAM" | "INR_PER_KG";
  rate: number | string;
  source: string;
  provider: string;
  market_session: "AM" | "PM" | null;
  gst_included: boolean | null;
  making_charges_included: boolean | null;
  observed_at: string;
  /** Stage 12: 'benchmark', 'spot_converted' or 'manual'. Optional because the
      column only exists once the Stage 12 migration has been run. */
  rate_type?: "benchmark" | "spot_converted" | "manual" | null;
  /** Stage 11 governance: only auto/approved rows are visible to the public. */
  approval_status: "auto" | "pending" | "approved" | "rejected" | null;
  delta_pct: number | string | null;
  approval_reason: string | null;
};

/** A value the plausibility check held back. Not on the site until approved. */
type PendingRow = {
  id: string;
  metal: "gold" | "silver";
  purity: string;
  unit: "INR_PER_10_GRAM" | "INR_PER_KG";
  rate: number | string;
  source: string | null;
  observed_at: string;
  delta_pct: number | string | null;
  approval_reason: string | null;
};

type LogRow = {
  id: string;
  job: string;
  status: "success" | "error" | "skipped";
  message: string | null;
  rows_affected: number | null;
  created_at: string;
};

/** Today's clock *in the showroom's timezone* — not the server's. */
function istNow(): { date: string; time: string } {
  const now = new Date();
  return {
    date: now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
    time: now.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function money(rate: number | string, unit: RateRow["unit"]): string {
  const value = typeof rate === "number" ? rate : Number(rate);
  if (!Number.isFinite(value)) return "—";
  return `₹ ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}${
    unit === "INR_PER_KG" ? " /kg" : " /10g"
  }`;
}

async function RatesScreen() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();
  const { date, time } = istNow();

  const [{ data: latest }, { data: logs }, { data: pendingRows, error: pendingError }, health] = await Promise.all([
    supabase!
      .from("metal_rates")
      .select(
        `id, metal, purity, unit, rate, source, provider, market_session, gst_included, making_charges_included, observed_at, approval_status, delta_pct, approval_reason`,
      )
      .order("observed_at", { ascending: false })
      .limit(40),
    supabase!
      .from("rate_job_logs")
      .select("id, job, status, message, rows_affected, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase!
      .from("metal_rates")
      .select("id, metal, purity, unit, rate, source, observed_at, delta_pct, approval_reason")
      .eq("approval_status", "pending")
      .order("observed_at", { ascending: false })
      .limit(20),
    rateHealth(),
  ]);

  const rows = (latest ?? []) as RateRow[];
  const pending = (pendingRows ?? []) as PendingRow[];
  // Without the Stage 11 migration the queue query fails; that is reported as an
  // instruction rather than as an empty (and therefore reassuring) list.
  const needsMigration = Boolean(pendingError && /approval_status|does not exist|schema cache/i.test(pendingError.message));

  return (
    <>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Rates</h1>
        <p className="mt-1 text-sm text-charcoal/70">
          IBJA publishes its benchmark on business days only, in the morning and again in the
          afternoon. Enter the reading you took, then check the published table below.
        </p>
      </div>

      <Panel>
        <PanelTitle hint="Which feed supplies the numbers, how fresh they are, and anything waiting for you. No API key is ever shown here.">
          Feed status
        </PanelTitle>
        <ul className="space-y-3">
          {health.map((check) => (
            <li key={check.label} className="flex items-start gap-3">
              <StatusPill
                tone={
                  check.state === "ok"
                    ? "ok"
                    : check.state === "warn"
                      ? "warn"
                      : check.state === "error"
                        ? "error"
                        : "info"
                }
              >
                {check.state === "ok"
                  ? "OK"
                  : check.state === "warn"
                    ? "Check"
                    : check.state === "error"
                      ? "Problem"
                      : "Info"}
              </StatusPill>
              <span className="text-sm">
                <span className="font-medium">{check.label}:</span>{" "}
                <span className="text-charcoal/70">{check.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gold/25 pt-4">
          <InlineAction
            action={runRateJobNow}
            label="Run now"
            hidden={{}}
            variant="primary"
            confirm="Fetch today's rates from the configured feed now? If today's rates are already stored, nothing is fetched and no API call is spent."
          />
          <span className="text-xs text-charcoal/70">
            Runs the same job the daily schedule runs. One API call at most, never on a page view.
          </span>
        </div>
        <p className="mt-4 text-xs text-charcoal/70">
          Provider setup, cost, and the licence terms to confirm before going live are in
          docs/RATE_PROVIDER.md.
        </p>
      </Panel>

      <Panel>
        <PanelTitle hint="A value that moves more than the approval threshold is stored but kept off the site until you decide. Rejecting keeps the record and never shows it to a customer.">
          Awaiting approval{pending.length > 0 ? ` (${pending.length})` : ""}
        </PanelTitle>
        {needsMigration ? (
          <p className="text-sm text-charcoal/70">
            The approval workflow needs the Stage 11 migration: run
            supabase/migrations/2026-10-15_stage-11_rate_provider_governance.sql. Until it is run,
            every recorded value is published as soon as it passes validation.
          </p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-charcoal/70">
            Nothing is waiting. A value appears here only when it jumps past the threshold against
            the last published value for the same series.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gold/40 text-left text-xs uppercase tracking-wide text-charcoal/70">
                  <th className="py-2 pr-3">Observed</th>
                  <th className="py-2 pr-3">Series</th>
                  <th className="py-2 pr-3">Value</th>
                  <th className="py-2 pr-3">Change</th>
                  <th className="py-2 pr-3">Why it was held</th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {pending.map((row) => (
                  <tr key={row.id} className="border-b border-gold/20 last:border-0 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(row.observed_at).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 pr-3">
                      {row.metal === "gold" ? "Gold" : "Silver"} · {row.purity}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{money(row.rate, row.unit)}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {row.delta_pct === null
                        ? "—"
                        : `${Number(row.delta_pct) > 0 ? "+" : ""}${Number(row.delta_pct).toFixed(2)}%`}
                    </td>
                    <td className="py-2 pr-3 text-xs text-charcoal/70">
                      {row.approval_reason ?? "Flagged by the plausibility check."}
                      <br />
                      <span>{row.source ?? "source not stated"}</span>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <InlineAction
                          action={approveRate}
                          label="Approve"
                          hidden={{ id: row.id }}
                          confirm="Publish this value on the website?"
                        />
                        <InlineAction
                          action={rejectRate}
                          label="Reject"
                          hidden={{ id: row.id }}
                          variant="danger"
                          confirm="Reject this value? It stays in the record and is never shown to customers."
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-charcoal/70">
          While a value waits, the website keeps showing the last published value with its own date.
          The threshold is configurable with RATE_MAX_JUMP_PCT.
        </p>
      </Panel>

      <Panel>
        <PanelTitle hint="Nothing is published until every entered value passes the same validation the scheduled feed uses.">
          Record a benchmark reading
        </PanelTitle>

        <ActionForm action={saveManualRates} submit="Publish these rates">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextInput
              name="observedDate"
              label="Observation date"
              type="date"
              required
              defaultValue={date}
              hint="The day the market reading is for."
            />
            <TextInput
              name="observedTime"
              label="Observation time (IST)"
              type="time"
              required
              defaultValue={time}
            />
            <Select
              name="session"
              label="Session"
              defaultValue="AM"
              options={[
                { value: "AM", label: "Morning (AM)" },
                { value: "PM", label: "Afternoon (PM)" },
              ]}
            />
            <TextInput
              name="sourceNote"
              label="Source"
              defaultValue="Entered by Tulsi Jewellers (IBJA benchmark)"
              hint="Printed to customers as the source of the value, verbatim. Name the benchmark you read."
            />
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 text-xs font-medium tracking-wide text-charcoal/70">
              Values — leave a box empty to skip that series
            </legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {RATE_ROWS.map((row) => (
                <TextInput
                  key={row.id}
                  name={`rate_${row.id}`}
                  label={`${row.purityLabel} (${row.unit === "INR_PER_KG" ? "₹ per kg" : "₹ per 10 g"})`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="—"
                />
              ))}
            </div>
          </fieldset>

          <div className="mt-4">
            <Checkbox
              name="makingChargesIncluded"
              label="This value includes making charges"
            />
          </div>
          <p className="mt-2 text-xs text-charcoal/70">
            Leave it unticked if the source does not state it. The public page always prints
            that making charges vary by design and are confirmed at the shop.
          </p>
        </ActionForm>
      </Panel>

      <Panel>
        <PanelTitle hint="Only values that were really recorded are listed. Deleting a mistake removes it from the public chart too.">
          Published readings
        </PanelTitle>

        {rows.length === 0 ? (
          <p className="text-sm text-charcoal/70">
            Nothing recorded yet, so the public Rates page shows its &ldquo;temporarily
            unavailable&rdquo; notice.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gold/40 text-left text-xs uppercase tracking-wide text-charcoal/70">
                  <th className="py-2 pr-3">Observed</th>
                  <th className="py-2 pr-3">Series</th>
                  <th className="py-2 pr-3">Value</th>
                  <th className="py-2 pr-3">Session</th>
                  <th className="py-2 pr-3">Charges</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gold/20 last:border-0 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(row.observed_at).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 pr-3">
                      {row.metal === "gold" ? "Gold" : "Silver"} · {row.purity}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{money(row.rate, row.unit)}</td>
                    <td className="py-2 pr-3">{row.market_session ?? "—"}</td>
                    <td className="py-2 pr-3 text-xs text-charcoal/70">
                      Making {row.making_charges_included ? "included" : "excluded"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-charcoal/70">
                      {row.source}
                      <br />
                      <span className="text-charcoal/70">
                        {row.provider}
                        {row.rate_type === "spot_converted" ? " · converted spot price" : ""}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      <StatusPill
                        tone={
                          row.approval_status === "pending"
                            ? "warn"
                            : row.approval_status === "rejected"
                              ? "error"
                              : "ok"
                        }
                      >
                        {row.approval_status ?? "auto"}
                      </StatusPill>
                      {row.delta_pct === null || row.delta_pct === undefined ? null : (
                        <span className="mt-1 block text-charcoal/70">
                          {Number(row.delta_pct) > 0 ? "+" : ""}
                          {Number(row.delta_pct).toFixed(2)}% vs previous
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <InlineAction
                        action={deleteRate}
                        label="Delete"
                        hidden={{ id: row.id }}
                        variant="danger"
                        confirm="Delete this reading? It disappears from the public chart as well."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-charcoal/70">{RATE_DISCLAIMER}</p>
      </Panel>

      <Panel>
        <PanelTitle hint="Every ingest attempt — manual or scheduled — is logged here, so a silent failure is impossible.">
          Job log
        </PanelTitle>
        {(logs ?? []).length === 0 ? (
          <p className="text-sm text-charcoal/70">No job has run yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {((logs ?? []) as LogRow[]).map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-3">
                <StatusPill tone={log.status === "error" ? "error" : log.status === "skipped" ? "warn" : "ok"}>
                  {log.status}
                </StatusPill>
                <span className="text-xs text-charcoal/70">
                  {new Date(log.created_at).toLocaleString("en-IN")}
                </span>
                <span className="text-charcoal/75">
                  {log.job}
                  {log.message ? ` — ${log.message}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

export default function AdminRatesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-charcoal/70">Loading rates…</p>}>
      <RatesScreen />
    </Suspense>
  );
}
