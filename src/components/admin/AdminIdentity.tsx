/**
 * components/admin/AdminIdentity.tsx — who is signed in, and a way out.
 *
 * A Server Component: it re-checks the admin gate on the request that renders it,
 * so the header can never show a stale name after access is revoked. It is always
 * rendered inside a <Suspense> boundary because it reads the session cookie.
 */

import { getAdminGate } from "@/lib/admin/auth";
import { signOutAction } from "@/lib/admin/actions";
import { SubmitButton } from "./AdminForms";

export default async function AdminIdentity() {
  const gate = await getAdminGate();

  if (gate.status !== "ok") {
    return (
      <span className="text-xs text-champagne/80">
        {gate.status === "unconfigured" ? "Setup needed" : "Not signed in"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-champagne/90">
        <span className="block truncate">{gate.admin.email}</span>
        <span className="uppercase tracking-wide text-champagne/60">{gate.admin.role}</span>
      </span>
      <form action={signOutAction}>
        <SubmitButton variant="ghost" className="!px-3 !py-1.5 !text-xs !text-champagne border-champagne/40">
          Sign out
        </SubmitButton>
      </form>
    </div>
  );
}
