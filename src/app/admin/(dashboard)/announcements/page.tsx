import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteAnnouncement, saveAnnouncement } from "@/lib/admin/actions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  ActionForm,
  Checkbox,
  InlineAction,
  Panel,
  PanelTitle,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/admin/AdminForms";

/**
 * /admin/announcements — the bar at the very top of every public page.
 *
 * Whatever is typed here is published verbatim. For that reason the form asks for
 * the source/context in the fields themselves: an operator cannot accidentally
 * publish an invented discount, because there is no field that implies one.
 */

type AnnouncementRow = {
  id: string;
  message_en: string;
  message_hi: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
};

/** `datetime-local` wants `YYYY-MM-DDTHH:MM` with no timezone suffix. */
function forInput(iso: string | null): string | undefined {
  return iso ? iso.slice(0, 16) : undefined;
}

async function AnnouncementsScreen() {
  await requireAdmin();
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase!
    .from("announcements")
    .select("id, message_en, message_hi, is_active, starts_at, ends_at, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as AnnouncementRow[];
  const now = new Date();
  const live = rows.find(
    (row) =>
      row.is_active &&
      (!row.starts_at || new Date(row.starts_at) <= now) &&
      (!row.ends_at || new Date(row.ends_at) >= now),
  );

  return (
    <>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Announcements</h1>
        <p className="mt-1 text-sm text-charcoal/70">
          The thin bar above the header. Only one shows at a time; the rest stay queued.
        </p>
      </div>

      <Panel>
        <PanelTitle>Currently showing</PanelTitle>
        {live ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{live.message_en}</p>
            <p>{live.message_hi}</p>
            {!live.starts_at && !live.ends_at ? (
              <p className="text-xs text-charcoal/70">No start or end date — it stays until you change it.</p>
            ) : (
              <p className="text-xs text-charcoal/70">
                {live.starts_at ? `From ${new Date(live.starts_at).toLocaleString("en-IN")} ` : ""}
                {live.ends_at ? `until ${new Date(live.ends_at).toLocaleString("en-IN")}` : ""}
              </p>
            )}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-charcoal/70">
            Nothing queued, so the bar shows the brand tagline instead of a message.
          </p>
        ) : (
          <p className="text-sm text-charcoal/70">
            Nothing is live right now (every entry is inactive, or its dates have passed), so the
            bar shows the brand tagline.
          </p>
        )}
      </Panel>

      <Panel>
        <PanelTitle hint="Both languages are required — a visitor reading in हिंदी must not see English.">
          Add an announcement
        </PanelTitle>
        <ActionForm action={saveAnnouncement} submit="Add announcement">
          <div className="grid gap-4">
            <TextArea name="message_en" label="Message (English)" rows={2} required />
            <TextArea name="message_hi" label="Message (हिंदी)" rows={2} required />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextInput name="starts_at" label="Starts" type="datetime-local" hint="Optional" />
              <TextInput name="ends_at" label="Ends" type="datetime-local" hint="Optional" />
              <TextInput name="sort_order" label="Sort order" type="number" min="0" defaultValue={0} />
            </div>
          </div>
          <div className="mt-3">
            <Checkbox name="is_active" label="Active" defaultChecked />
          </div>
        </ActionForm>
      </Panel>

      <Panel>
        <PanelTitle>All announcements</PanelTitle>
        {rows.length === 0 ? (
          <p className="text-sm text-charcoal/70">None yet.</p>
        ) : (
          <ul className="divide-y divide-gold/20">
            {rows.map((row) => (
              <li key={row.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm">{row.message_en}</p>
                    <p className="text-sm text-charcoal/70">{row.message_hi}</p>
                    <p className="mt-1 text-xs text-charcoal/70">
                      sort {row.sort_order}
                      {row.starts_at ? ` · from ${new Date(row.starts_at).toLocaleString("en-IN")}` : ""}
                      {row.ends_at ? ` · until ${new Date(row.ends_at).toLocaleString("en-IN")}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={row.id === live?.id ? "ok" : row.is_active ? "warn" : "muted"}>
                      {row.id === live?.id ? "live" : row.is_active ? "active" : "inactive"}
                    </StatusPill>
                    <InlineAction
                      action={deleteAnnouncement}
                      label="Delete"
                      hidden={{ id: row.id }}
                      variant="danger"
                      confirm="Delete this announcement?"
                    />
                  </div>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-maroon hover:underline">Edit</summary>
                  <div className="mt-3">
                    <ActionForm action={saveAnnouncement} submit="Save changes">
                      <input type="hidden" name="id" value={row.id} />
                      <div className="grid gap-4">
                        <TextArea
                          name="message_en"
                          label="Message (English)"
                          rows={2}
                          required
                          defaultValue={row.message_en}
                        />
                        <TextArea
                          name="message_hi"
                          label="Message (हिंदी)"
                          rows={2}
                          required
                          defaultValue={row.message_hi}
                        />
                        <div className="grid gap-4 sm:grid-cols-3">
                          <TextInput
                            name="starts_at"
                            label="Starts"
                            type="datetime-local"
                            defaultValue={forInput(row.starts_at)}
                          />
                          <TextInput
                            name="ends_at"
                            label="Ends"
                            type="datetime-local"
                            defaultValue={forInput(row.ends_at)}
                          />
                          <TextInput
                            name="sort_order"
                            label="Sort order"
                            type="number"
                            min="0"
                            defaultValue={row.sort_order}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Checkbox name="is_active" label="Active" defaultChecked={row.is_active} />
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

export default function AdminAnnouncementsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-charcoal/70">Loading announcements…</p>}>
      <AnnouncementsScreen />
    </Suspense>
  );
}
