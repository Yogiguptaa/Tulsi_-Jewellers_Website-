/**
 * enquiries/store.ts — where an enquiry is saved. SERVER-ONLY.
 *
 * Order of preference:
 *   1. Supabase (`enquiries` / `scheme_enquiries`) via the service-role client —
 *      the production path. RLS allows anon INSERT but the privileged client is
 *      used so the row is written even if policies are tightened later.
 *   2. A local JSONL file under `.data/` — used while Supabase is not configured
 *      (local development, or a self-hosted Node server). The file is gitignored.
 *   3. Nothing writable → the API returns `stored: "none"` and the UI tells the
 *      visitor to call or WhatsApp instead, so an enquiry is never silently lost.
 */

import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLocalFs } from "@/lib/runtime/local-disk";
import type { Enquiry } from "./schema";

export type StoreResult = {
  stored: "database" | "file" | "none";
  /** Safe message for logs — never includes the visitor's details. */
  detail: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "enquiries.jsonl");

export async function saveEnquiry(enquiry: Enquiry): Promise<StoreResult> {
  const client = getSupabaseAdminClient();

  if (client) {
    if (enquiry.kind === "scheme") {
      const { error } = await client.from("scheme_enquiries").insert({
        name: enquiry.name,
        phone: enquiry.phone,
        email: enquiry.email === "" ? null : enquiry.email,
        monthly_amount: enquiry.monthlyAmount ?? null,
        message: enquiry.message,
        status: "new",
      });
      if (!error) return { stored: "database", detail: "saved to scheme_enquiries" };
      // Fall through to the file so the enquiry is not lost.
    }

    const { error } = await client.from("enquiries").insert({
      // The DB enum only has 'product' | 'general'; the finer kind is kept in the
      // message prefix so the showroom can see where the enquiry came from.
      kind: enquiry.productCode ? "product" : "general",
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email === "" ? null : enquiry.email,
      message: [enquiry.productCode ? `[product ${enquiry.productCode}]` : null, enquiry.message]
        .filter(Boolean)
        .join(" "),
      status: "new",
    });
    if (!error) return { stored: "database", detail: "saved to enquiries" };
  }

  // Local fallback: append-only JSONL so nothing is overwritten. Contains
  // personal data by necessity, so it is gitignored and never served publicly.
  // On Cloudflare Workers there is no disk at all, so `fs` is `null` and the
  // caller reports `stored: "none"` — the UI then asks the visitor to call or
  // WhatsApp, which is truthful.
  const fs = await getLocalFs();
  if (!fs) {
    return {
      stored: "none",
      detail: "no writable store (Supabase not configured and this runtime has no filesystem)",
    };
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.appendFile(
      DATA_FILE,
      `${JSON.stringify({ ...enquiry, website: undefined, savedAt: new Date().toISOString() })}\n`,
      "utf8",
    );
    return { stored: "file", detail: "saved to .data/enquiries.jsonl" };
  } catch {
    return {
      stored: "none",
      detail: "no writable store (Supabase not configured and the filesystem is read-only)",
    };
  }
}
