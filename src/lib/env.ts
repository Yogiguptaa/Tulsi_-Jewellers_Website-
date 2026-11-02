/**
 * lib/env.ts — configuration sanity checks.
 *
 * Nothing here is required for the site to run: the rates work keylessly, the
 * catalogue falls back to its bundled data, and Supabase is optional. What this
 * module does is turn a *malformed* variable (a percentage typed as "5%", a
 * monthly limit of zero, a URL with a trailing slash, a half-configured Supabase)
 * into a clear, named problem that the health check reports — instead of a
 * mystery failure three layers down in the rate job.
 *
 * It never prints a value: only the variable's name and what is wrong with it.
 */

export type EnvProblem = {
  name: string;
  message: string;
};

export type EnvReport = {
  /** True when nothing would misbehave. */
  ok: boolean;
  problems: EnvProblem[];
};

type EnvLike = Record<string, string | undefined>;

function numeric(env: EnvLike, name: string, min: number, max: number, problems: EnvProblem[]) {
  const raw = env[name]?.trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    problems.push({ name, message: `must be a number between ${min} and ${max}` });
    return null;
  }
  return value;
}

export function inspectEnv(env: EnvLike = process.env): EnvReport {
  const problems: EnvProblem[] = [];

  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    if (!/^https?:\/\/[^\s]+$/.test(siteUrl)) {
      problems.push({ name: "NEXT_PUBLIC_SITE_URL", message: "must be an http(s) URL" });
    } else if (siteUrl.endsWith("/")) {
      problems.push({
        name: "NEXT_PUBLIC_SITE_URL",
        message: "must not end with a slash (it is joined with route paths)",
      });
    }
  }

  numeric(env, "RATE_API_MONTHLY_LIMIT", 1, 100_000, problems);
  numeric(env, "RATE_MAX_JUMP_PCT", 0, 100, problems);
  numeric(env, "RATE_MAX_AGE_DAYS", 1, 365, problems);
  numeric(env, "RATE_INDIAN_MARKET_PCT", -50, 50, problems);
  numeric(env, "RATE_USD_INR", 20, 500, problems);

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim() || env.SUPABASE_URL?.trim();
  const supabaseAnon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (supabaseUrl && !/^https?:\/\//.test(supabaseUrl)) {
    problems.push({ name: "NEXT_PUBLIC_SUPABASE_URL", message: "must be an http(s) URL" });
  }
  if (supabaseUrl && !supabaseAnon) {
    problems.push({
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      message: "is missing while NEXT_PUBLIC_SUPABASE_URL is set",
    });
  }
  if (!supabaseUrl && supabaseAnon) {
    problems.push({
      name: "NEXT_PUBLIC_SUPABASE_URL",
      message: "is missing while NEXT_PUBLIC_SUPABASE_ANON_KEY is set",
    });
  }

  const cronSecret = env.CRON_SECRET?.trim();
  if (cronSecret && cronSecret.length < 16) {
    problems.push({ name: "CRON_SECRET", message: "is shorter than 16 characters" });
  }

  return { ok: problems.length === 0, problems };
}

/** True when the site runs entirely from its bundled data (no database attached). */
export function isDatabaseConfigured(env: EnvLike = process.env): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim() && env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
}

/** True when the scheduled rate job can authenticate against this deployment. */
export function isCronConfigured(env: EnvLike = process.env): boolean {
  return Boolean(env.CRON_SECRET?.trim());
}
