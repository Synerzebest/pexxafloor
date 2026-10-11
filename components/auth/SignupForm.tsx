"use client";

import { useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, UserPlus, Mail, MailCheck, User } from "lucide-react";
import { signupWithEmail } from "@/app/actions/signupEmail";
import PasswordInput from "@/components/ui/PasswordInput";
import AuthShell, { AuthAlert, AuthDivider, GoogleButton, authInputClass } from "@/components/auth/AuthShell";

export default function SignupForm({
  locale,
  nextPath,
}: {
  locale: string;
  nextPath?: string;
}) {
  const t = useTranslations("Signup");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const fieldErrors: Record<FieldKey, string | null> = {
    name: name.trim() ? null : t("errors.name_missing"),
    email: EMAIL_PATTERN.test(email.trim()) ? null : t("fields.emailInvalid"),
    password: pwd.length >= 8 ? null : t("errors.tooShort"),
  };
  // Errors appear once a field is left, not while the user is still typing in it.
  const visibleError = (field: FieldKey) =>
    (touched[field] || submitted) ? fieldErrors[field] : null;
  const touch = (field: FieldKey) => () => setTouched((current) => ({ ...current, [field]: true }));

  async function handleSubmit(formData: FormData) {
    setErr(null);
    setSubmitted(true);

    const firstInvalid = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLInputElement>(`#signup-${firstInvalid}`)?.focus();
      return;
    }

    try {
      setLoading(true);
      if (nextPath) formData.set("next", nextPath);
      formData.set("locale", locale);
      const result = await signupWithEmail(formData);

      if (result.error) {
        const errorKeyByCode: Record<string, string> = {
          email_exists: "errors.emailAlreadyUsed",
          user_already_exists: "errors.emailAlreadyUsed",
          weak_password: "errors.weakPassword",
          over_email_send_rate_limit: "errors.emailRateLimit",
          over_request_rate_limit: "errors.requestRateLimit",
          email_address_not_authorized: "errors.emailNotAuthorized",
          signup_disabled: "errors.signupDisabled",
          email_provider_disabled: "errors.signupDisabled",
        };

        setErr(t(errorKeyByCode[result.error.code] || "errors.generic"));
        return;
      }

      if (result.requiresEmailConfirmation) {
        setConfirmationSent(true);
        return;
      }

      router.replace(nextPath || `/${locale}/profile`);
      router.refresh();
    } catch (error) {
      console.error("Signup failed:", error);
      setErr(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  const loginHref = `/${locale}/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`;

  if (confirmationSent) {
    return (
      <AuthShell locale={locale}>
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange-50 text-orange-600">
            <MailCheck className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">
            {t("confirmation.title")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {t("confirmation.description")}
          </p>
          <p className="mt-3 break-all font-medium text-gray-900">{email}</p>
          <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4 text-left text-sm leading-6 text-orange-900">
            {t("confirmation.instructions")}
          </div>
          <Link
            href={loginHref}
            className="mt-7 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {t("confirmation.login")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("alreadyAccount")}{" "}
          <Link href={loginHref} className="font-semibold text-orange-600 transition hover:text-orange-700">
            {t("login")}
          </Link>
        </>
      }
    >
      <GoogleButton
        href={`/auth/login/google?next=${encodeURIComponent(nextPath || `/${locale}/profile`)}`}
        label={t("google")}
      />

      <AuthDivider label={t("or")} />

      <form ref={formRef} action={handleSubmit} noValidate className="space-y-3">
        <Field id="signup-name" label={t("name")} error={visibleError("name")}>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="signup-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={touch("name")}
              {...fieldA11y("signup-name", visibleError("name"))}
              className={`${inputClass(visibleError("name"))} pl-11 pr-4`}
            />
          </div>
        </Field>

        <Field id="signup-email" label={t("email")} error={visibleError("email")}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="signup-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={touch("email")}
              {...fieldA11y("signup-email", visibleError("email"))}
              className={`${inputClass(visibleError("email"))} pl-11 pr-4`}
            />
          </div>
        </Field>

        <Field
          id="signup-password"
          label={t("password")}
          error={visibleError("password")}
          hint={<Hint ok={pwd.length >= 8}>{t("fields.passwordHint")}</Hint>}
        >
          <PasswordInput
            id="signup-password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onBlur={touch("password")}
            {...fieldA11y("signup-password", visibleError("password"))}
            className={inputClass(visibleError("password"))}
          />
        </Field>

        {err && <AuthAlert tone="error">{err}</AuthAlert>}

        <button
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <UserPlus className="h-5 w-5" />
          )}
          {t("cta")}
        </button>
      </form>
    </AuthShell>
  );
}

type FieldKey = "name" | "email" | "password";
const FIELD_ORDER: FieldKey[] = ["name", "email", "password"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function inputClass(error: string | null) {
  return error
    ? authInputClass.replace("border-gray-300", "border-red-400").replace("focus:border-orange-500 focus:ring-orange-100", "focus:border-red-500 focus:ring-red-100")
    : authInputClass;
}

function fieldA11y(id: string, error: string | null) {
  return {
    "aria-invalid": Boolean(error),
    "aria-describedby": `${id}-message`,
  };
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {/* Only takes space when there is something to show */}
      <div id={`${id}-message`} aria-live="polite" className="text-xs empty:hidden">
        {error ? <p className="text-red-600">{error}</p> : hint}
      </div>
    </div>
  );
}

function Hint({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <p className={`flex items-center gap-1 transition-colors ${ok ? "text-emerald-600" : "text-gray-500"}`}>
      <Check className={`h-3.5 w-3.5 transition-opacity ${ok ? "opacity-100" : "opacity-40"}`} aria-hidden="true" />
      {children}
    </p>
  );
}
