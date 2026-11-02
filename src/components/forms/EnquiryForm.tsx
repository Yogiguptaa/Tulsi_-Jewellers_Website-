"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, MessageCircle, Phone, Send } from "lucide-react";
import { CONTACT, telDisplay, telHref, whatsappHref } from "@/lib/config";
import { enquirySchema, type EnquiryErrors } from "@/lib/enquiries/schema";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Notice from "@/components/ui/Notice";

type EnquiryKind = "general" | "product" | "scheme" | "visit" | "custom";

type Props = {
  kind?: EnquiryKind;
  /** Pre-fills the item the visitor came from (product code, scheme, …). */
  productCode?: string;
  /** Context line shown above the form fields. */
  context?: string;
  /** Shows the monthly-amount field (scheme enquiries only). */
  withMonthlyAmount?: boolean;
  /** Shows the preferred-visit field (visit enquiries only). */
  withVisitDate?: boolean;
  title?: string;
  subtitle?: string;
};

/**
 * One form for every enquiry type. Validation comes from the shared zod schema,
 * so the browser's feedback and the API's decision can never disagree. The form
 * always offers the phone and WhatsApp routes as well — an enquiry must never be
 * a dead end if the network is down.
 */
export default function EnquiryForm({
  kind = "general",
  productCode,
  context,
  withMonthlyAmount = false,
  withVisitDate = false,
  title,
  subtitle,
}: Props) {
  const { t } = useLanguage();
  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    monthlyAmount: "",
    preferredVisit: "",
    consent: true,
    website: "",
  });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const { lang } = useLanguage();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const update = (field: keyof typeof values, value: string | boolean) =>
    setValues((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerMessage(null);

    const payload = {
      kind,
      name: values.name,
      phone: values.phone,
      email: values.email,
      message: values.message,
      productCode,
      monthlyAmount: values.monthlyAmount === "" ? undefined : Number(values.monthlyAmount),
      preferredVisit: values.preferredVisit === "" ? undefined : values.preferredVisit,
      website: values.website,
      consent: values.consent,
    };

    const parsed = enquirySchema.safeParse(payload);
    if (!parsed.success) {
      const next: EnquiryErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in next)) {
          next[field as keyof EnquiryErrors] = issue.message;
        }
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setState("sending");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await response.json()) as { ok?: boolean; message?: string; errors?: EnquiryErrors };

      if (!response.ok || !body.ok) {
        if (body.errors) setErrors(body.errors);
        setState("failed");
        setServerMessage(
          response.status === 429 ? t("enquiry.rateLimited") : body.message ?? t("enquiry.errorGeneric"),
        );
        return;
      }

      setState("sent");
      setValues((current) => ({ ...current, message: "" }));
    } catch {
      setState("failed");
      setServerMessage(t("enquiry.errorGeneric"));
    }
  };

  if (state === "sent") {
    return (
      <div className="space-y-4 border border-emerald-600/30 bg-emerald-600/5 p-6">
        <p className="inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-xl text-emerald-600">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          {t("enquiry.success")}
        </p>
        <p className="text-sm text-charcoal/75">{t("enquiry.successNote")}</p>
        <ContactFallback />
      </div>
    );
  }

  const phone = CONTACT.phones[0];
  // If the site cannot save the enquiry (no database configured yet, or a
  // storage failure), the visitor is never left at a dead end: the same words
  // open in WhatsApp, already written out, so the enquiry still reaches us.
  const handoff = whatsappHref(
    [
      values.name ? `Name: ${values.name}` : null,
      values.phone ? `Phone: ${values.phone}` : null,
      values.email ? `Email: ${values.email}` : null,
      values.monthlyAmount ? `Monthly amount: ₹${values.monthlyAmount}` : null,
      values.message ? values.message : null,
    ]
      .filter(Boolean)
      .join("\n") || "Hello Tulsi Jewellers, I would like to make an enquiry.",
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4 border border-gold/25 bg-offwhite p-5 sm:p-6">
      {title ? (
        <div className="space-y-1">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-maroon">{title}</h2>
          {subtitle ? <p className="text-sm text-charcoal/70">{subtitle}</p> : null}
        </div>
      ) : null}

      {context ? <p className="text-sm text-charcoal/75">{context}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("common.name")}
          required
          value={values.name}
          onChange={(value) => update("name", value)}
          error={errors.name}
          autoComplete="name"
        />
        <Field
          label={t("common.phone")}
          required
          value={values.phone}
          onChange={(value) => update("phone", value)}
          error={errors.phone}
          type="tel"
          autoComplete="tel"
        />
      </div>

      <Field
        label={t("common.email")}
        value={values.email}
        onChange={(value) => update("email", value)}
        error={errors.email}
        type="email"
        autoComplete="email"
      />

      {withMonthlyAmount ? (
        <Field
          label={t("enquiry.schemeAmount")}
          value={values.monthlyAmount}
          onChange={(value) => update("monthlyAmount", value)}
          error={errors.monthlyAmount}
          type="number"
        />
      ) : null}

      {withVisitDate ? (
        <Field
          label={t("enquiry.preferredVisit")}
          value={values.preferredVisit}
          onChange={(value) => update("preferredVisit", value)}
          error={errors.preferredVisit}
        />
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-charcoal">
          {t("common.message")} <span className="text-maroon">*</span>
        </span>
        <textarea
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          rows={4}
          placeholder={t("enquiry.messagePlaceholder")}
          aria-invalid={Boolean(errors.message)}
          className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2.5 text-sm focus:border-maroon focus:outline-none"
        />
        {errors.message ? <span className="text-xs text-maroon">{errors.message}</span> : null}
      </label>

      {/* Honeypot: hidden from people, filled by bots. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(event) => update("website", event.target.value)}
          />
        </label>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-charcoal/80">
        <input
          type="checkbox"
          checked={values.consent}
          onChange={(event) => update("consent", event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#5a0f1b]"
        />
        {t("enquiry.consent")}
      </label>

      {state === "failed" && serverMessage ? (
        <div className="space-y-3">
          <Notice tone="warning">{serverMessage}</Notice>
          {handoff ? (
            <a
              href={handoff}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 underline underline-offset-4"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {lang === "hi" ? "यही बात व्हाट्सऐप पर भेजें" : "Send the same details on WhatsApp"}
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex items-center gap-2 rounded-sm bg-maroon px-6 py-3 text-sm font-medium text-offwhite transition-colors hover:bg-maroon-700 disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {state === "sending" ? t("common.sending") : t("common.submit")}
        </button>
        <span className="text-xs text-charcoal/70">
          {t("enquiry.requiredMark")} {t("enquiry.optionalMark")}
        </span>
      </div>

      <div className="border-t border-gold/25 pt-4">
        <p className="text-xs text-charcoal/70">
          {t("enquiry.callInstead")}{" "}
          <a href={telHref(phone.number)} className="inline-flex items-center gap-1 font-medium text-maroon">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {telDisplay(phone.number)}
          </a>{" "}
          {t("enquiry.orWhatsapp")}
        </p>
        <ContactFallback />
      </div>
    </form>
  );
}

/** WhatsApp + all listed numbers, always reachable even if the form fails. */
function ContactFallback() {
  const { t } = useLanguage();
  const wa = whatsappHref("Hello Tulsi Jewellers, I have a question.");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {t("common.whatsapp")}
        </a>
      ) : null}
      {CONTACT.phones.map((entry) => (
        <a
          key={entry.number}
          href={telHref(entry.number)}
          className="inline-flex items-center gap-1.5 text-sm text-charcoal/75 hover:text-maroon"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          {telDisplay(entry.number)}
        </a>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-charcoal">
        {label} {required ? <span className="text-maroon">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2.5 text-sm focus:border-maroon focus:outline-none"
      />
      {error ? <span className="text-xs text-maroon">{error}</span> : null}
    </label>
  );
}
