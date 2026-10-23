/**
 * content/public-content.ts — SERVER-ONLY reads of admin-managed content.
 *
 * These are the *only* place the public site learns about rows the admin panel
 * writes, so "approve a review" or "activate an announcement" really does change
 * what a visitor sees.
 *
 * Two rules, both about honesty:
 *  • An empty table is not an error — each function falls back to the built-in
 *    code content (`src/lib/content/*`) rather than showing nothing.
 *  • A failed read is treated as "no published content", never as "invent
 *    something". Nothing here can fabricate a review, a rating or a promotion.
 *
 * Reads are cached with `use cache` and tagged, so the admin actions'
 * `revalidateTag(...)` makes an edit visible on the next request.
 */

import { cacheLife, cacheTag } from "next/cache";
import type { LocalizedText } from "@/lib/config";
import { publicSupabase } from "@/lib/supabase/public";
import { FAQ_ITEMS, type FaqItem } from "./faq";
import type { Review } from "./reviews";

/* -------------------------------------------------------------------------- */
/* Announcements                                                               */
/* -------------------------------------------------------------------------- */

type AnnouncementRow = {
  message_en: string;
  message_hi: string;
  starts_at: string | null;
  ends_at: string | null;
};

/**
 * The single announcement to show in the top bar, or null to show the brand
 * tagline instead. Rows outside their `starts_at`/`ends_at` window are skipped,
 * which is how a seasonal notice expires without anyone remembering to remove it.
 *
 * Cache note: the window is evaluated when the cached value is built, so a notice
 * may stay on screen up to the cache lifetime (`cacheLife("minutes")`) past its
 * end time — and an edit in /admin invalidates it immediately.
 */
export async function getActiveAnnouncement(): Promise<LocalizedText | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("announcements");

  const supabase = publicSupabase();
  if (!supabase) return null;

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("announcements")
      .select("message_en, message_hi, starts_at, ends_at")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data) return null;

    const live = (data as AnnouncementRow[]).find(
      (row) =>
        (!row.starts_at || row.starts_at <= now) && (!row.ends_at || row.ends_at >= now),
    );
    if (!live) return null;

    return { en: live.message_en, hi: live.message_hi };
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Reviews                                                                     */
/* -------------------------------------------------------------------------- */

const REVIEWS_TAG = "reviews";

/**
 * Genuine, owner-approved reviews. Returns `null` when the table has none, so the
 * caller can keep showing the clearly-labelled sample layout instead.
 */
export async function getPublicReviews(): Promise<Review[] | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(REVIEWS_TAG);

  const supabase = publicSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, author_name, rating, comment, source, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(24);

    if (error || !data || data.length === 0) return null;

    return data.map((row) => {
      const comment = row.comment ?? "";
      return {
        id: row.id,
        author: row.author_name,
        // A stored rating is the customer's own; never inferred or rounded up.
        rating: typeof row.rating === "number" ? row.rating : null,
        body: { en: comment, hi: comment },
      };
    });
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* FAQs                                                                        */
/* -------------------------------------------------------------------------- */

const FAQ_GROUPS: FaqItem["group"][] = ["store", "products", "delivery", "rates", "scheme"];

/**
 * FAQ content for /faq: the admin-managed rows when there are any, otherwise the
 * reviewed set baked into `content/faq.ts`. The visible page and its FAQPage
 * structured data are both built from the value returned here, so they cannot
 * drift apart.
 */
export async function getFaqItems(): Promise<FaqItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("faqs");

  const supabase = publicSupabase();
  if (!supabase) return FAQ_ITEMS;

  try {
    const { data, error } = await supabase
      .from("faqs")
      .select("id, question_en, question_hi, answer_en, answer_hi, category, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) return FAQ_ITEMS;

    return data.map((row) => {
      const category = (row.category ?? "").trim().toLowerCase() as FaqItem["group"];
      return {
        id: row.id,
        // The DB column is free text; anything unexpected is grouped under "store"
        // rather than inventing a new section with no heading.
        group: FAQ_GROUPS.includes(category) ? category : "store",
        question: { en: row.question_en, hi: row.question_hi },
        answer: { en: row.answer_en, hi: row.answer_hi },
      };
    });
  } catch {
    return FAQ_ITEMS;
  }
}
