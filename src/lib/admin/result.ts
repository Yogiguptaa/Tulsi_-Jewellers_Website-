/**
 * admin/result.ts — the shape every admin Server Action returns.
 *
 * Kept in its own module (not in actions.ts) because a `"use server"` file may
 * only export async functions.
 */

export type AdminActionResult = {
  ok: boolean;
  /** Short, human-readable outcome shown under the form. Never a stack trace. */
  message: string;
  /** Field-level problems keyed by input name. */
  errors?: Record<string, string>;
};

export const IDLE: AdminActionResult = { ok: false, message: "" };

export function ok(message: string): AdminActionResult {
  return { ok: true, message };
}

export function fail(message: string, errors?: Record<string, string>): AdminActionResult {
  return errors ? { ok: false, message, errors } : { ok: false, message };
}

/**
 * Supabase error text is database English ("duplicate key value violates ...").
 * Translate the two an operator actually hits into something actionable; keep the
 * original for anything else so a real problem is not hidden.
 */
export function explainDbError(message: string): string {
  if (/duplicate key|already exists/i.test(message)) {
    return "That code, slug or key is already used by another record.";
  }
  if (/row-level security|permission denied|violates row-level/i.test(message)) {
    return "The database refused this change. Your admin access may have been revoked — sign in again, or ask the owner to restore your row in admin_users.";
  }
  if (/does not exist|schema cache/i.test(message)) {
    return "The database is missing a column or table this form needs. Run the Stage 2.1 migration, then try again.";
  }
  return message;
}
