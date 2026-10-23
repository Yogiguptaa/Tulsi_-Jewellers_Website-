/**
 * POST /api/enquiries — receive a contact, product or scheme enquiry.
 *
 * Protections, in order: same-origin check, in-memory rate limit per IP, honeypot
 * field, then schema validation. Every response is a short JSON object; nothing
 * internal (stack traces, credentials, storage paths) is ever returned to the
 * browser, and the visitor's details are never logged.
 */

import { NextResponse } from "next/server";
import { collectErrors, enquirySchema } from "@/lib/enquiries/schema";
import { saveEnquiry } from "@/lib/enquiries/store";

// No segment config: a POST handler is never prerendered, and with Cache
// Components enabled request-time work happens where it belongs.

/** Simple fixed-window limiter: 5 submissions per IP per 10 minutes. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  // Same-origin fetch from our own pages always sends Origin in modern browsers.
  // A missing Origin is allowed because some privacy tools strip it.
  if (!origin) return true;
  // Compare against the Host header, not `request.url`: Next reports its own
  // configured hostname there, so a visitor on 127.0.0.1:3210 (or a LAN address)
  // would be rejected even though the request really is same-origin.
  const host = request.headers.get("host");
  if (!host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, message: "Request blocked." }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, message: "Too many enquiries from this device. Please call or WhatsApp us instead." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Could not read the form." }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please check the highlighted fields.", errors: collectErrors(parsed.error) },
      { status: 422 },
    );
  }

  // Honeypot: a filled hidden field means a bot. Answer with a success-shaped
  // response so the bot does not retry, but store nothing.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true, stored: "none" });
  }

  const result = await saveEnquiry(parsed.data);

  if (result.stored === "none") {
    return NextResponse.json(
      {
        ok: false,
        message:
          "We could not save your enquiry right now. Please call or WhatsApp the showroom so we do not miss you.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, stored: result.stored });
}
