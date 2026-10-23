import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { rateHealth } from "@/lib/admin/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getRatesSnapshot } from "@/lib/rates/service";
import { STATUS_LABEL, formatRate, formatDateTime } from "@/lib/rates/format";
import { Panel, PanelTitle, StatusPill } from "@/components/admin/AdminForms";

/**
 * /admin — the overview.
 *
 * The first question an owner has is "is the site telling the truth right now?",
 * so the rate panel deliberately calls `getRatesSnapshot()` — the very same
 * function the public Rates page and the home-page ticker use. Showing a second,
 * independently-queried table here would risk the panel and the site disagreeing,
 * which is exactly the kind of drift that makes an admin screen untrustworthy.
 */

function countOf(value: number | null): number {
  return value ?? 0;
}

async function DashboardScreen() {
  const admin = await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const [snapshot, categories, products, active, enquiries, newEnquiries, scheme, pending, featured, health] =
    await Promise.all([
      getRatesSnapshot(),
      supabase!.from("categories").select("id", { count: "exact", head: true }),
      supabase!.from("products").select("id", { count: "exact", head: true }),
      supabase!.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase!.from("enquiries").select("id", { count: "exact", head: true }),
      supabase!.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase!.from("scheme_enquiries").select("id", { count: "exact", head: true }),
      supabase!.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase!
        .from("products")
        .select("code, name_en, status")
        .eq("is_featured", true)
        .order("sort_order", { ascending: true })
        .limit(8),
      rateHealth(),
    ]);

  // Converted spot prices are never called a published benchmark.
  const statusLabel =
    snapshot.spotConverted && snapshot.status === "updated"
      ? { en: "Latest available rate", hi: "नवीनतम उपलब्ध भाव", tone: "text-emerald-600" }
      : STATUS_LABEL[snapshot.status];
  const tone =
    snapshot.status === "live" || snapshot.status === "updated"
      ? "ok"
      : snapshot.status === "market_closed" || snapshot.status === "stale"
        ? "warn"
        : "error";

  const counts = [
    { label: "Products", value: countOf(products.count), href: "/admin/products" },
    { label: "Live on site", value: countOf(active.count), href: "/admin/products" },
    { label: "Collections", value: countOf(categories.count), href: "/admin/categories" },
    { label: "Enquiries", value: countOf(enquiries.count), href: "/admin/enquiries" },
    { label: "New enquiries", value: countOf(newEnquiries.count), href: "/admin/enquiries" },
    { label: "Scheme enquiries", value: countOf(scheme.count), href: "/admin/enquiries" },
    { label: "Reviews to check", value: countOf(pending.count), href: "/admin/reviews" },
  ];

  return (
    <>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-charcoal">
          Namaste, {admin.email.split("@")[0]}
        </h1>
        <p className="mt-1 text-sm text-charcoal/70">
          What the website is showing visitors right now, and what needs your attention.
        </p>
      </div>

      <Panel>
        <PanelTitle hint="This panel reads the same cached snapshot as the public Rates page and the home-page ticker, so the two can never disagree.">
          Today&apos;s published benchmark
        </PanelTitle>

        {snapshot.lines.every((line) => line.latest === null) ? (
          <div className="rounded-sm border border-gold/50 bg-gold/5 p-4">
            <p className="text-sm font-medium text-charcoal">
              {snapshot.notice ?? "No rate has been recorded."}
            </p>
            <p className="mt-1 text-sm text-charcoal/70">
              The site is showing its &ldquo;temporarily unavailable&rdquo; notice rather than a number.
            </p>
            <Link
              href="/admin/rates"
              className="mt-3 inline-block rounded-sm bg-maroon px-4 py-2 text-sm text-offwhite hover:bg-maroon-700"
            >
              Record today&apos;s rate
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal/70">
              <StatusPill tone={tone}>{statusLabel.en}</StatusPill>
              <span>
                Newest observation: {formatDateTime(snapshot.asOf) ?? "—"}
                {snapshot.asOf ? ` · ${snapshot.providerLabel}` : ""}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gold/40 text-left text-xs uppercase tracking-wide text-charcoal/70">
                    <th className="py-2 pr-3">Series</th>
                    <th className="py-2 pr-3">Value</th>
                    <th className="py-2 pr-3">Observed</th>
                    <th className="py-2">Charges</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.lines.map((line) => (
                    <tr key={line.row.id} className="border-b border-gold/20 last:border-0">
                      <td className="py-2 pr-3 font-medium">{line.row.purityLabel}</td>
                      <td className="py-2 pr-3 tabular-nums">
                        {line.latest ? formatRate(line.latest.rate, line.latest.unit) : "—"}
                      </td>
                      <td className="py-2 pr-3 text-charcoal/70">
                        {formatDateTime(line.latest?.observedAt ?? null) ?? "—"}
                      </td>
                      <td className="py-2 text-xs text-charcoal/70">
                        {line.latest
                          ? line.latest.makingChargesIncluded
                            ? "Making charges included"
                            : "Making charges excluded"
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>

      <Panel>
        <PanelTitle hint="Counts include drafts and archived records, so they match what the admin lists show.">
          Records
        </PanelTitle>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {counts.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="block rounded-sm border border-gold/40 bg-ivory px-3 py-3 hover:border-maroon/50"
              >
                <span className="block font-[family-name:var(--font-display)] text-2xl text-maroon">
                  {item.value}
                </span>
                <span className="block text-xs text-charcoal/70">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle hint="Rate-provider health. A warning here means the site is showing an older value or an honest notice.">
            Rate system health
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
        </Panel>

        <Panel>
          <PanelTitle hint="Shown in the “Featured” row on the home page, lowest sort order first.">
            Featured products
          </PanelTitle>
          {featured.data && featured.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {featured.data.map((product) => (
                <li key={product.code} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/admin/products/${product.code}`}
                    className="text-charcoal hover:text-maroon hover:underline"
                  >
                    {product.name_en}
                  </Link>
                  <StatusPill tone={product.status === "active" ? "ok" : "muted"}>
                    {product.status}
                  </StatusPill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal/70">
              Nothing is marked as featured yet. Open a product and tick &ldquo;Featured on the home
              page&rdquo;.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<p className="text-sm text-charcoal/70">Loading the dashboard…</p>}>
      <DashboardScreen />
    </Suspense>
  );
}
