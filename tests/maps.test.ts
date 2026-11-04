import { describe, expect, it } from "vitest";
import { CONTACT, directionsHref, safeHttpsUrl } from "@/lib/config";

describe("maps links", () => {
  it("accepts a normal https Google Maps link", () => {
    expect(safeHttpsUrl("https://maps.app.goo.gl/abc123")).toBe(
      "https://maps.app.goo.gl/abc123",
    );
  });

  it("refuses anything that is not https", () => {
    expect(safeHttpsUrl("http://maps.google.com/?q=x")).toBeNull();
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("maps.app.goo.gl/abc123")).toBeNull();
    expect(safeHttpsUrl("")).toBeNull();
  });

  it("always has a working directions link, configured or not", () => {
    const href = directionsHref();
    expect(href.startsWith("https://")).toBe(true);
    expect(href).toContain("Tulsi");
  });

  it("keeps the published address in the fallback search", () => {
    expect(CONTACT.googleMapsLink).toContain(encodeURIComponent("Hansapuri"));
  });
});
