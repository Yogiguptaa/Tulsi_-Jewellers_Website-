import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { safeFetchJson } from "@/lib/safeFetch";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("safeFetchJson", () => {
  it("returns parsed, validated data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ price: 1234 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await safeFetchJson("https://example.com/rate", {
      schema: z.object({ price: z.number() }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.price).toBe(1234);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 503 and succeeds on the next attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "busy" }, 503))
      .mockResolvedValueOnce(jsonResponse({ price: 99 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await safeFetchJson("https://example.com/rate", {
      schema: z.object({ price: z.number() }),
      attempts: 2,
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 404 — a wrong key or path must surface, not loop", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "nope" }, 404));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await safeFetchJson("https://example.com/rate", { attempts: 3 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("http");
      expect(result.error.status).toBe(404);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never throws when the network rejects", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await safeFetchJson("https://example.com/rate", { attempts: 2 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("network");
  });

  it("reports a non-JSON body instead of returning it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("<html>blocked</html>", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await safeFetchJson("https://example.com/rate", { attempts: 1 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("json");
  });

  it("rejects a payload that does not match the schema", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ price: "not a number" }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await safeFetchJson("https://example.com/rate", {
      schema: z.object({ price: z.number() }),
      attempts: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("validation");
  });

  it("gives up after the timeout", async () => {
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await safeFetchJson("https://example.com/slow", {
      attempts: 1,
      timeoutMs: 40,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("timeout");
  });

  it("logs one JSON line with no URL and no payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    vi.stubGlobal("fetch", fetchMock);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await safeFetchJson("https://example.com/secret?api_key=abc123", {
      attempts: 1,
      label: "rates:spot",
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const line = String(errorSpy.mock.calls[0][0]);
    expect(line).not.toContain("abc123");
    expect(line).not.toContain("example.com");
    expect(JSON.parse(line)).toMatchObject({ scope: "safeFetch", label: "rates:spot", kind: "http" });
  });
});
