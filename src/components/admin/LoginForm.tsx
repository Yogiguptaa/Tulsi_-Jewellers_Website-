"use client";

/**
 * components/admin/LoginForm.tsx — email/password sign-in.
 *
 * Talks to Supabase Auth directly from the browser (the publishable anon key is
 * designed for that). No password, token or key is ever put in a URL, a log line
 * or localStorage beyond what the Supabase client itself manages.
 *
 * After a successful sign-in we `router.replace(next)` and `router.refresh()` so
 * the server components re-render with the new session cookie in place.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Field } from "./AdminForms";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured yet. Follow the setup steps on this page first.");
      return;
    }

    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (signInError) {
      // Deliberately generic: this screen must not reveal whether an address exists.
      setError(
        /invalid login credentials/i.test(signInError.message)
          ? "That email and password combination was not accepted."
          : signInError.message,
      );
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email address" required>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Password" required>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2 text-sm"
        />
      </Field>

      {error ? (
        <p role="alert" className="rounded-sm border border-maroon/40 bg-maroon/5 px-3 py-2 text-sm text-maroon">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-sm bg-maroon px-4 py-2.5 text-sm font-medium text-offwhite transition hover:bg-maroon-700 disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
