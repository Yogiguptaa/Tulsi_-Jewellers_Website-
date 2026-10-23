"use client";

import { Clock } from "lucide-react";
import { CONTACT, HOURS_SCHEDULE, hasStructuredHours, isPlaceholder } from "@/lib/config";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useNowMs } from "@/lib/clock";

/**
 * "Open now" — computed from the published opening hours in Asia/Kolkata, never
 * from the visitor's own time zone (a customer browsing from abroad must still
 * see whether the showroom is open in Nagpur).
 *
 * Rules:
 *  • Renders nothing at all while the hours are still a placeholder, so the site
 *    never claims a state it cannot know.
 *  • An open showroom says when it closes; a closed one says when it next opens —
 *    including "tomorrow" and "Sunday" handled correctly (Sunday is closed).
 *  • The decision is made once per minute from the shared clock, so the server
 *    render and the browser cannot disagree on hydration.
 */

const MINUTES_IN_DAY = 24 * 60;

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Clock and weekday of the showroom, whatever the visitor's own time zone is. */
function showroomClock(nowMs: number): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(nowMs));

  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value("weekday"));
  return {
    weekday: weekdayIndex < 0 ? 0 : weekdayIndex,
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

function prettyTime(time: string, lang: "en" | "hi"): string {
  const total = minutesOf(time);
  const hours24 = Math.floor(total / 60);
  const minutes = total % 60;
  const suffix = hours24 >= 12 ? (lang === "hi" ? "शाम" : "pm") : lang === "hi" ? "सुबह" : "am";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export default function OpenNow({ className = "" }: { className?: string }) {
  const { lang, t } = useLanguage();
  const now = useNowMs();

  // Before hydration (and while the hours are unknown) render nothing rather than
  // a guess that could be wrong.
  if (now === null || !hasStructuredHours() || isPlaceholder(CONTACT.hours.en)) return null;

  const { weekday, minutes } = showroomClock(now);
  const today = HOURS_SCHEDULE[weekday] ?? null;

  const isOpen = today !== null && minutes >= minutesOf(today.open) && minutes < minutesOf(today.close);

  if (isOpen && today) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
        <Clock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        <span className="font-medium text-emerald-600">{t("visit.openNow")}</span>
        <span className="text-charcoal/70">
          · {t("visit.closesAt", { time: prettyTime(today.close, lang) })}
        </span>
      </span>
    );
  }

  // Closed: find the next day the showroom opens (up to a week ahead).
  for (let offset = 0; offset < 8; offset += 1) {
    const day = (weekday + offset) % 7;
    const schedule = HOURS_SCHEDULE[day] ?? null;
    if (!schedule) continue;
    if (offset === 0 && minutes >= minutesOf(schedule.close)) continue; // already closed today
    const when =
      offset === 0
        ? t("visit.today")
        : offset === 1
          ? t("visit.tomorrow")
          : new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
              weekday: "long",
              timeZone: "Asia/Kolkata",
            }).format(new Date(now + offset * 86_400_000));
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
        <Clock className="h-3.5 w-3.5 text-maroon" aria-hidden="true" />
        <span className="font-medium text-maroon">{t("visit.closedNow")}</span>
        <span className="text-charcoal/70">
          · {t("visit.opensAt", { when, time: prettyTime(schedule.open, lang) })}
        </span>
      </span>
    );
  }

  return (
    <span className={`text-sm text-charcoal/70 ${className}`}>{t("visit.hoursNote")}</span>
  );
}

export { MINUTES_IN_DAY };
