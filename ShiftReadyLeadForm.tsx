import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Check, Loader2, Mail, ShieldCheck } from "lucide-react";
import { contacts, events } from "@/integrations/core";
import { trackEvent } from "@/lib/tracking";
import { GUIDE_PATH, GUIDE_TITLE, PUBLIC_GUIDE_URL } from "./shiftReadyContent";

type FormStatus = "idle" | "submitting" | "success" | "error";

const EMAIL_CONSENT_COPY = "I would like occasional practical updates from SHIFT+ in the future. I can unsubscribe at any time.";

export function ShiftReadyLeadForm() {
  const firstNameId = useId();
  const emailId = useId();
  const consentId = useId();
  const messageId = useId();
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const submitting = status === "submitting";

  useEffect(() => {
    if (status === "success") successHeadingRef.current?.focus();
  }, [status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = firstName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setStatus("error");
      setMessage("Enter your first name so we know who to address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setMessage("Please confirm that you want occasional practical updates from SHIFT+.");
      return;
    }

    setStatus("submitting");
    setMessage("");
    try {
      await contacts({
        email: cleanEmail,
        first_name: cleanName,
        contact_stage: "lead",
        source: "shift_ready_guide",
        tags: ["shift-ready-guide", "lead-magnet"],
        append_notes: `Requested "${GUIDE_TITLE}". Consent: "${EMAIL_CONSENT_COPY}"`,
      });

      await events({
        event_name: "shift_ready_guide_requested",
        contact_email: cleanEmail,
        properties: {
          first_name: cleanName,
          guide_title: GUIDE_TITLE,
          guide_url: PUBLIC_GUIDE_URL,
          email_opt_in: true,
          email_opt_in_language: EMAIL_CONSENT_COPY,
        },
        source: "shift_plus_web",
        source_event_id: `shift_ready_guide_requested:${cleanEmail}`,
      });
      trackEvent("shift_ready_guide_requested", { entry_point: "shift_ready", destination: "guide_page" });
      setStatus("success");
    } catch {
      setStatus("error");
      setMessage("We could not confirm your request. Please try again. A repeat submission will update the same contact, not create a duplicate.");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl border border-safety/40 bg-navy-mid p-6 shadow-lg sm:p-8" aria-live="polite">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-safety text-navy">
          <Check className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <p className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-safety">REQUEST RECEIVED</p>
        <h3 ref={successHeadingRef} tabIndex={-1} className="mt-2 font-display text-3xl font-extrabold tracking-wide text-cream outline-none">
          Your guide is ready.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-cream/70 sm:text-base">
          Thanks, {firstName}. The full guide is ready to open now, and your request is saved to SHIFT+.
        </p>
        <div className="mt-6 grid gap-3">
          <a
            href={GUIDE_PATH}
            data-track-id="shift-ready-guide-open"
            onClick={() => trackEvent("resource_click", { resource_id: "shift-ready-guide", resource_type: "guide", placement: "lead_capture_success", destination: "guide_page" })}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-safety px-5 py-3.5 font-display text-lg font-bold uppercase tracking-wide text-navy transition hover:bg-safety-deep hover:text-cream"
          >
            Open the Shift Ready guide
            <ArrowRight className="h-5 w-5" />
          </a>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center rounded-md border border-white/20 px-5 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream transition hover:border-white/40 hover:bg-white/5"
          >
            Start My SHIFT+ Membership →
          </a>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-cream/50">
          Already requested the guide? You are still covered. We keep one contact record and refresh your guide request.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-navy-mid p-5 shadow-lg sm:p-7">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-safety/15 text-safety">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-safety">GUIDE ACCESS</p>
          <p className="mt-1 text-sm leading-relaxed text-cream/65">The full guide opens on this page after submission, and your request is saved to SHIFT+.</p>
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate aria-describedby={message ? messageId : undefined}>
        <div>
          <label htmlFor={firstNameId} className="text-sm font-semibold text-cream">First name</label>
          <input
            id={firstNameId}
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            disabled={submitting}
            placeholder="Jordan"
            className="mt-1.5 w-full rounded-md border border-white/15 bg-navy px-3.5 py-3 text-base text-cream placeholder:text-cream/30 focus:border-safety focus:outline-none focus:ring-2 focus:ring-safety/30 disabled:cursor-wait disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor={emailId} className="text-sm font-semibold text-cream">Email address</label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            placeholder="you@workmail.com"
            className="mt-1.5 w-full rounded-md border border-white/15 bg-navy px-3.5 py-3 text-base text-cream placeholder:text-cream/30 focus:border-safety focus:outline-none focus:ring-2 focus:ring-safety/30 disabled:cursor-wait disabled:opacity-60"
          />
        </div>
        <label htmlFor={consentId} className="flex cursor-pointer items-start gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-cream/70">
          <input
            id={consentId}
            name="consent"
            type="checkbox"
            required
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            disabled={submitting}
            className="mt-1 h-4 w-4 shrink-0 accent-safety"
          />
          <span>{EMAIL_CONSENT_COPY}</span>
        </label>
        {message && (
          <p id={messageId} role="alert" aria-live="polite" className="rounded-md border border-red-300/30 bg-red-400/10 px-3 py-2.5 text-sm leading-relaxed text-red-100">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-safety px-5 py-3.5 font-display text-lg font-bold uppercase tracking-wide text-navy transition hover:bg-safety-deep hover:text-cream disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          {submitting ? "Saving my request" : "Get my free guide"}
        </button>
        <p className="text-center text-xs leading-relaxed text-cream/45">
          Your email stays with SHIFT+. The guide opens here after submission, and your request is saved.
        </p>
      </form>
    </div>
  );
}
