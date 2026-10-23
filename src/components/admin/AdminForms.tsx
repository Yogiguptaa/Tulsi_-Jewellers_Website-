"use client";

/**
 * components/admin/AdminForms.tsx — the building blocks every admin screen uses.
 *
 * A "use client" module, because these wrap `useActionState` / `useFormStatus`.
 * Server Actions are passed in as props from the server pages, which is the
 * supported way to call them from a client component.
 */

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { AdminActionResult } from "@/lib/admin/result";

export type AdminAction = (state: AdminActionResult, data: FormData) => Promise<AdminActionResult>;

const IDLE: AdminActionResult = { ok: false, message: "" };

/* -------------------------------------------------------------------------- */
/* Inputs                                                                      */
/* -------------------------------------------------------------------------- */

type BaseProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

const controlClass =
  "w-full rounded-sm border border-gold/40 bg-offwhite px-3 py-2 text-sm text-charcoal " +
  "placeholder:text-charcoal/35 focus:border-maroon focus:outline-none";

export function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium tracking-wide text-charcoal/70">
        {label}
        {required ? <span className="text-maroon"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-charcoal/70">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ name, label, hint, required, defaultValue, type, className, placeholder, ...rest }: BaseProps & {
  defaultValue?: string | number | null;
  type?: "text" | "number" | "url" | "datetime-local" | "date" | "time";
  placeholder?: string;
  step?: string;
  min?: string;
}) {
  return (
    <Field label={label} hint={hint} required={required} className={className}>
      <input
        name={name}
        type={type ?? "text"}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        required={required}
        className={controlClass}
        {...rest}
      />
    </Field>
  );
}

export function TextArea({ name, label, hint, required, defaultValue, rows = 3, className, placeholder }: BaseProps & {
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint} required={required} className={className}>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        required={required}
        className={controlClass}
      />
    </Field>
  );
}

export function Select({
  name,
  label,
  options,
  defaultValue,
  hint,
  required,
  className,
}: BaseProps & {
  options: { value: string; label: string }[];
  defaultValue?: string | null;
}) {
  return (
    <Field label={label} hint={hint} required={required} className={className}>
      <select name={name} defaultValue={defaultValue ?? undefined} className={controlClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({
  name,
  label,
  defaultChecked,
  hint,
  className,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`flex items-start gap-2 text-sm ${className ?? ""}`}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded-sm border-gold/60 accent-maroon"
      />
      <span>
        {label}
        {hint ? <span className="block text-xs text-charcoal/70">{hint}</span> : null}
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

export function SubmitButton({
  children,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition disabled:opacity-60";
  const styles = {
    primary: "bg-maroon text-offwhite hover:bg-maroon-700",
    ghost: "border border-gold/50 bg-transparent text-charcoal hover:bg-ivory",
    danger: "border border-maroon/40 text-maroon hover:bg-maroon/10",
  }[variant];

  return (
    <button type="submit" disabled={pending} className={`${base} ${styles} ${className ?? ""}`}>
      {pending ? "Working…" : children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Forms                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A form bound to a Server Action, with inline success/error feedback.
 * `action` comes from a server page; everything else is presentation.
 */
export function ActionForm({
  action,
  children,
  submit,
  variant = "primary",
  className,
  confirm,
  hidden,
  compact = false,
}: {
  action: AdminAction;
  children?: ReactNode;
  submit: string;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  /** Ask before running a destructive action (browser confirm). */
  confirm?: string;
  /** Simple values sent as hidden inputs, for one-click buttons. */
  hidden?: Record<string, string>;
  compact?: boolean;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={
        confirm
          ? (event) => {
              if (!window.confirm(confirm)) event.preventDefault();
            }
          : undefined
      }
    >
      {hidden
        ? Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      {children}
      <div className={compact ? "" : "mt-4"}>
        <SubmitButton variant={variant}>{submit}</SubmitButton>
      </div>
      {state.message ? (
        <p
          role="status"
          className={`mt-3 rounded-sm border px-3 py-2 text-sm ${
            state.ok
              ? "border-emerald-600/40 bg-emerald-600/5 text-emerald-600"
              : "border-maroon/40 bg-maroon/5 text-maroon"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

/** A form that is just a button in a table cell (status changes, deletes). */
export function InlineAction({
  action,
  label,
  hidden,
  variant = "ghost",
  confirm,
}: {
  action: AdminAction;
  label: string;
  hidden: Record<string, string>;
  variant?: "primary" | "ghost" | "danger";
  confirm?: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  const styles = {
    primary: "text-maroon hover:underline",
    ghost: "text-charcoal/70 hover:text-charcoal hover:underline",
    danger: "text-maroon/80 hover:text-maroon hover:underline",
  }[variant];

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={
        confirm
          ? (event) => {
              if (!window.confirm(confirm)) event.preventDefault();
            }
          : undefined
      }
      title={state.message || undefined}
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={`text-xs font-medium ${styles}`}>
        {label}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Presentational helpers (server-safe to reuse inside client pages)           */
/* -------------------------------------------------------------------------- */

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-sm border border-gold/40 bg-offwhite p-4 shadow-[var(--shadow-soft)] sm:p-5 ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

export function PanelTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <header className="mb-4">
      <h2 className="font-[family-name:var(--font-display)] text-lg text-charcoal">{children}</h2>
      {hint ? <p className="mt-1 text-xs text-charcoal/70">{hint}</p> : null}
    </header>
  );
}

export function StatusPill({ tone, children }: { tone: "ok" | "warn" | "error" | "info" | "muted"; children: ReactNode }) {
  const styles = {
    ok: "border-emerald-600/40 bg-emerald-600/10 text-emerald-600",
    warn: "border-gold/60 bg-gold/10 text-gold-700",
    error: "border-maroon/50 bg-maroon/10 text-maroon",
    info: "border-charcoal/25 bg-ivory text-charcoal/70",
    muted: "border-charcoal/15 bg-transparent text-charcoal/70",
  }[tone];
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide ${styles}`}>
      {children}
    </span>
  );
}
