import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteEnquiry, setEnquiryStatus } from "@/lib/admin/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  ActionForm,
  InlineAction,
  Panel,
  PanelTitle,
  Select,
  StatusPill,
} from "@/components/admin/AdminForms";

/**
 * /admin/enquiries — the visitor enquiries, newest first.
 *
 * Deliberately has no export button: the brief forbids bulk export of personal
 * data. Each row is read one at a time, and the visitor's message is shown as they
 * wrote it. Nothing here is editable except the internal status, so an operator
 * cannot rewrite what a customer said.
 */

type EnquiryRow = {
  id: string;
  kind: "product" | "general";
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  created_at: string;
};

type SchemeRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  monthly_amount: number | string | null;
  message: string | null;
  status: "new" | "in_progress" | "resolved" | "closed";
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function Contact({ phone, email }: { phone: string; email: string | null }) {
  return (
    <span className="text-xs text-charcoal/70">
      <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-maroon hover:underline">
        {phone}
      </a>
      {email ? (
        <>
          {" · "}
          <a href={`mailto:${email}`} className="hover:text-maroon hover:underline">
            {email}
          </a>
        </>
      ) : null}
    </span>
  );
}

function EnquiryCard({
  row,
  table,
  extra,
}: {
  row: EnquiryRow | SchemeRow;
  table: "enquiries" | "scheme_enquiries";
  extra?: string;
}) {
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">
            {row.name} <Contact phone={row.phone} email={row.email} />
          </p>
          <p className="text-xs text-charcoal/70">{when(row.created_at)}</p>
        </div>
        <StatusPill tone={row.status === "new" ? "warn" : row.status === "resolved" ? "ok" : "info"}>
          {row.status.replace("_", " ")}
        </StatusPill>
      </div>

      {extra ? <p className="mt-2 text-xs text-charcoal/70">{extra}</p> : null}

      <p className="mt-2 whitespace-pre-wrap text-sm text-charcoal/80">
        {"message" in row ? row.message : null}
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <ActionForm
          action={setEnquiryStatus}
          submit="Update status"
          variant="ghost"
          className="flex items-end gap-2"
          hidden={{ id: row.id, table }}
        >
          <Select
            name="status"
            label="Status"
            defaultValue={row.status}
            options={STATUS_OPTIONS}
            className="w-40"
          />
        </ActionForm>
        <InlineAction
          action={deleteEnquiry}
          label="Delete"
          hidden={{ id: row.id, table }}
          variant="danger"
          confirm="Delete this enquiry permanently?"
        />
      </div>
    </li>
  );
}

async function EnquiriesScreen() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const [{ data: enquiries }, { data: scheme }] = await Promise.all([
    supabase!
      .from("enquiries")
      .select("id, kind, name, phone, email, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase!
      .from("scheme_enquiries")
      .select("id, name, phone, email, monthly_amount, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const general = (enquiries ?? []) as EnquiryRow[];
  const schemeRows = (scheme ?? []) as SchemeRow[];

  return (
    <>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Enquiries</h1>
        <p className="mt-1 text-sm text-charcoal/70">
          Everything a visitor sent through the site. Replying happens on the phone or by email —
          there is no mail automation here, and no export of these details.
        </p>
      </div>

      <Panel>
        <PanelTitle hint="Product enquiries carry the product code in the message, so you can look it up.">
          Website enquiries ({general.length})
        </PanelTitle>
        {general.length === 0 ? (
          <p className="text-sm text-charcoal/70">No enquiries yet.</p>
        ) : (
          <ul className="divide-y divide-gold/20">
            {general.map((row) => (
              <EnquiryCard
                key={row.id}
                row={row}
                table="enquiries"
                extra={`${row.kind === "product" ? "Product" : "General"} enquiry`}
              />
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelTitle hint="Subject to the scheme terms the owner still has to confirm — the site says so on the scheme page.">
          Gold saving scheme enquiries ({schemeRows.length})
        </PanelTitle>
        {schemeRows.length === 0 ? (
          <p className="text-sm text-charcoal/70">No scheme enquiries yet.</p>
        ) : (
          <ul className="divide-y divide-gold/20">
            {schemeRows.map((row) => (
              <EnquiryCard
                key={row.id}
                row={row}
                table="scheme_enquiries"
                extra={
                  row.monthly_amount
                    ? `Intended monthly amount: ₹ ${Number(row.monthly_amount).toLocaleString("en-IN")}`
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

export default function AdminEnquiriesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-charcoal/70">Loading enquiries…</p>}>
      <EnquiriesScreen />
    </Suspense>
  );
}
