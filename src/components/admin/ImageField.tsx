"use client";

/**
 * components/admin/ImageField.tsx — product photography.
 *
 * The value the server receives is a text area: one `url | alt EN | alt HI` per
 * line, in display order (the first line becomes the primary image). That keeps
 * the form serialisable without a multipart parser on the server, and it means
 * an image can also be referenced by URL (an owner-uploaded Storage file).
 *
 * Uploads go straight from the browser to the `product-images` bucket using the
 * signed-in admin's own session — the storage RLS policy is what authorises the
 * write. No key of any kind is embedded in the page.
 */

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/providers/ToastProvider";

const BUCKET = "product-images";

export default function ImageField({ defaultValue }: { defaultValue?: string }) {
  const { toast } = useToast();
  const [value, setValue] = useState(defaultValue ?? "");
  const [altEn, setAltEn] = useState("");
  const [altHi, setAltHi] = useState("");
  const [busy, setBusy] = useState(false);

  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  async function upload(file: File) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast("Supabase is not configured, so uploads are unavailable. Paste an image URL instead.");
      return;
    }

    setBusy(true);
    try {
      const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
      // Random file name: two phones uploading "IMG_0123.jpg" must not collide.
      const path = `${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type || undefined,
        upsert: false,
      });
      if (error) {
        toast(
          /policy|permission|denied/i.test(error.message)
            ? "The storage policy refused this upload. Check that you are an admin, then try again."
            : error.message,
        );
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const line = [data.publicUrl, altEn, altHi]
        .map((part) => part.replace(/\|/g, "/").trim())
        .join(" | ");
      setValue((prev) => (prev.trim() ? `${prev.trim()}\n${line}` : line));
      toast("Image uploaded and added to the gallery.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium tracking-wide text-charcoal/70">
            Alt text (English)
          </span>
          <input
            value={altEn}
            onChange={(event) => setAltEn(event.target.value)}
            placeholder="e.g. 22K gold chain with pendant"
            className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium tracking-wide text-charcoal/70">
            Alt text (हिंदी)
          </span>
          <input
            value={altHi}
            onChange={(event) => setAltHi(event.target.value)}
            placeholder="जैसे 22K सोने की चेन"
            className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-sm border border-gold/50 px-3 py-2 text-sm ${busy ? "opacity-60" : ""}`}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
          {busy ? "Uploading…" : "Upload an image"}
        </label>
        <span className="text-xs text-charcoal/70">
          Alt text is stored from the fields above. Nothing is sent to a third party.
        </span>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium tracking-wide text-charcoal/70">
          Gallery — one <code className="text-[11px]">url | alt EN | alt HI</code> per line; the first
          line is the main image
        </span>
        <textarea
          name="images"
          rows={5}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://…/chain.jpg | 22K gold chain | 22K सोने की चेन"
          className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2 font-mono text-xs"
        />
      </label>

      {lines.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {lines.map((line, index) => {
            const [url] = line.split("|").map((part) => part.trim());
            return (
              <li key={`${url}-${index}`} className="overflow-hidden rounded-sm border border-gold/40">
                {/* Static previews; the real alt text lives in the column above. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" width={72} height={72} className="h-18 w-18 object-cover" />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
