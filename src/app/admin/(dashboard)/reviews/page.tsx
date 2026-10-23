import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteReview, saveReview, setReviewStatus } from "@/lib/admin/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  ActionForm,
  InlineAction,
  Panel,
  PanelTitle,
  Select,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/admin/AdminForms";

/**
 * /admin/reviews — genuine reviews only.
 *
 * The `reviews` table has no public insert policy, so nothing can appear here
 * except what the owner types in. The form asks where a review came from
 * (Google, a WhatsApp message, a written slip at the counter) and stores that
 * answer, because an unattributed review is not evidence of anything.
 *
 * Approving a review publishes it on the home page and invalidates the cached
 * pages immediately.
 */

type ReviewRow = {
  id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  source: string | null;
  created_at: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-gold-700" aria-label={`${rating} out of 5`}>
      {"★".repeat(Math.max(0, Math.min(5, rating)))}
      <span className="text-charcoal/20">{"★".repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

async function ReviewsScreen() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase!
    .from("reviews")
    .select("id, author_name, rating, comment, status, source, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as ReviewRow[];
  const pending = rows.filter((row) => row.status === "pending");

  return (
    <>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Reviews</h1>
        <p className="mt-1 text-sm text-charcoal/70">
          {rows.length} stored · {pending.length} waiting to be checked. Only reviews you collected
          with the customer&apos;s permission belong here — invented ones are dishonest and are also
          illegal in advertising.
        </p>
      </div>

      {rows.length === 0 ? (
        <Panel>
          <PanelTitle>Nothing yet</PanelTitle>
          <p className="text-sm text-charcoal/70">
            The home page shows no reviews at all right now — the review block is hidden until there
            is something real to put in it, and there are no sample slots left in the code. Add a
            review below, approve it, and the block appears on the home page automatically.
          </p>
        </Panel>
      ) : null}

      <Panel>
        <PanelTitle hint="Type exactly what the customer wrote. Trimming spelling is fine; adding praise is not.">
          Add a genuine review
        </PanelTitle>
        <ActionForm action={saveReview} submit="Save review">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput name="author_name" label="Customer name" required hint="As they want it shown." />
            <Select
              name="rating"
              label="Rating"
              defaultValue="5"
              options={[1, 2, 3, 4, 5].map((value) => ({
                value: String(value),
                label: `${value} star${value === 1 ? "" : "s"}`,
              }))}
            />
            <TextInput
              name="source"
              label="Where it came from"
              hint="e.g. Google review, WhatsApp message, written at the counter."
          className="sm:col-span-2"
            />
            <TextArea name="comment" label="What they said" rows={3} className="sm:col-span-2" />
            <Select
              name="status"
              label="Status"
              defaultValue="pending"
              options={[
                { value: "pending", label: "Pending — not shown yet" },
                { value: "approved", label: "Approved — show on the site" },
                { value: "rejected", label: "Rejected — keep, do not show" },
              ]}
            />
          </div>
        </ActionForm>
      </Panel>

      <Panel>
        <PanelTitle>All reviews</PanelTitle>
        {rows.length === 0 ? (
          <p className="text-sm text-charcoal/70">Nothing stored.</p>
        ) : (
          <ul className="divide-y divide-gold/20">
            {rows.map((row) => (
              <li key={row.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {row.author_name} <Stars rating={row.rating} />
                    </p>
                    <p className="text-xs text-charcoal/70">
                      {new Date(row.created_at).toLocaleDateString("en-IN")}
                      {row.source ? ` · ${row.source}` : " · no source recorded"}
                    </p>
                  </div>
                  <StatusPill
                    tone={
                      row.status === "approved" ? "ok" : row.status === "pending" ? "warn" : "muted"
                    }
                  >
                    {row.status}
                  </StatusPill>
                </div>

                {row.comment ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-charcoal/80">{row.comment}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {row.status !== "approved" ? (
                    <InlineAction
                      action={setReviewStatus}
                      label="Approve & publish"
                      hidden={{ id: row.id, status: "approved" }}
                      variant="primary"
                    />
                  ) : (
                    <InlineAction
                      action={setReviewStatus}
                      label="Unpublish"
                      hidden={{ id: row.id, status: "pending" }}
                    />
                  )}
                  {row.status !== "rejected" ? (
                    <InlineAction
                      action={setReviewStatus}
                      label="Reject"
                      hidden={{ id: row.id, status: "rejected" }}
                    />
                  ) : null}
                  <InlineAction
                    action={deleteReview}
                    label="Delete"
                    hidden={{ id: row.id }}
                    variant="danger"
                    confirm="Delete this review permanently?"
                  />
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-maroon hover:underline">Edit</summary>
                  <div className="mt-3">
                    <ActionForm action={saveReview} submit="Save changes">
                      <input type="hidden" name="id" value={row.id} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextInput
                          name="author_name"
                          label="Customer name"
                          required
                          defaultValue={row.author_name}
                        />
                        <Select
                          name="rating"
                          label="Rating"
                          defaultValue={String(row.rating)}
                          options={[1, 2, 3, 4, 5].map((value) => ({
                            value: String(value),
                            label: `${value} star${value === 1 ? "" : "s"}`,
                          }))}
                        />
                        <TextInput
                          name="source"
                          label="Where it came from"
                          defaultValue={row.source}
                          className="sm:col-span-2"
                        />
                        <TextArea
                          name="comment"
                          label="What they said"
                          rows={3}
                          defaultValue={row.comment}
                          className="sm:col-span-2"
                        />
                        <Select
                          name="status"
                          label="Status"
                          defaultValue={row.status}
                          options={[
                            { value: "pending", label: "Pending" },
                            { value: "approved", label: "Approved" },
                            { value: "rejected", label: "Rejected" },
                          ]}
                        />
                      </div>
                    </ActionForm>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-charcoal/70">Loading reviews…</p>}>
      <ReviewsScreen />
    </Suspense>
  );
}
