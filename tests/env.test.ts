import { describe, expect, it } from "vitest";
import { inspectEnv, isCronConfigured, isDatabaseConfigured } from "@/lib/env";

describe("inspectEnv", () => {
  it("accepts an empty environment — the site runs keyless", () => {
    expect(inspectEnv({})).toEqual({ ok: true, problems: [] });
  });

  it("accepts a fully configured environment", () => {
    const report = inspectEnv({
      NEXT_PUBLIC_SITE_URL: "https://tulsijewellers.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      RATE_MAX_JUMP_PCT: "5",
      RATE_API_MONTHLY_LIMIT: "200",
      RATE_USD_INR: "94.96",
      CRON_SECRET: "0123456789abcdef0123",
    });
    expect(report.problems).toEqual([]);
  });

  it("names a malformed percentage without echoing the value", () => {
    const report = inspectEnv({ RATE_MAX_JUMP_PCT: "5%" });
    expect(report.ok).toBe(false);
    expect(report.problems[0].name).toBe("RATE_MAX_JUMP_PCT");
    expect(JSON.stringify(report)).not.toContain("5%");
  });

  it("rejects a site URL with a trailing slash and a non-http value", () => {
    expect(inspectEnv({ NEXT_PUBLIC_SITE_URL: "https://x.com/" }).problems[0].message).toContain("slash");
    expect(inspectEnv({ NEXT_PUBLIC_SITE_URL: "tulsijewellers.com" }).ok).toBe(false);
  });

  it("catches a half-configured Supabase in both directions", () => {
    expect(inspectEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }).ok).toBe(false);
    expect(inspectEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "key" }).ok).toBe(false);
  });

  it("flags a too-short cron secret", () => {
    expect(inspectEnv({ CRON_SECRET: "short" }).problems[0].name).toBe("CRON_SECRET");
  });
});

describe("feature flags", () => {
  it("reports the database as configured only when both public values exist", () => {
    expect(isDatabaseConfigured({})).toBe(false);
    expect(isDatabaseConfigured({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" })).toBe(false);
    expect(
      isDatabaseConfigured({
        NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "key",
      }),
    ).toBe(true);
  });

  it("reports the cron as configured only when the secret is set", () => {
    expect(isCronConfigured({})).toBe(false);
    expect(isCronConfigured({ CRON_SECRET: "0123456789abcdef" })).toBe(true);
  });
});
